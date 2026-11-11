'use client';

import * as React from 'react';
import {
  isPwaStandalone,
  getPwaPlatformInfo,
  PwaPlatformInfo,
  markAppInstalled,
  isAppInstalledStorage,
  launchAndroidInstalledApp,
  BeforeInstallPromptEvent,
} from './pwa-utils';

export function usePwaInstall() {
  const [isStandalone, setIsStandalone] = React.useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = React.useState<boolean>(false);
  const [platformInfo, setPlatformInfo] = React.useState<PwaPlatformInfo>({
    isIos: false,
    isAndroid: false,
    isDesktop: false,
    isInAppBrowser: false,
  });
  const [isPrompting, setIsPrompting] = React.useState<boolean>(false);

  React.useEffect(() => {
    // 1. Initial checks
    const initialStandalone = isPwaStandalone();
    setIsStandalone(initialStandalone);
    setPlatformInfo(getPwaPlatformInfo());

    // Check if previously installed via storage or standalone
    const storedInstalled = isAppInstalledStorage() || initialStandalone;
    if (storedInstalled) {
      setIsInstalled(true);
    }

    // Modern Chrome API to detect if WebAPK is installed
    if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
      (navigator as any)
        .getInstalledRelatedApps()
        .then((relatedApps: any[]) => {
          if (Array.isArray(relatedApps) && relatedApps.length > 0) {
            setIsInstalled(true);
            markAppInstalled();
          }
        })
        .catch(() => {});
    }

    // 2. Check early captured prompt from <head> script
    if (typeof window !== 'undefined') {
      if (window.__deferredPwaPrompt) {
        setDeferredPrompt(window.__deferredPwaPrompt);
      }
      window.__onPwaPromptReady = (e: BeforeInstallPromptEvent) => {
        setDeferredPrompt(e);
      };
    }

    // 3. Listen to display-mode changes (e.g. user opens standalone window)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setIsInstalled(true);
        markAppInstalled();
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    // 4. Capture native install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent automatic mini-infobar on mobile Chrome
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      if (typeof window !== 'undefined') {
        window.__deferredPwaPrompt = promptEvent;
      }
      setDeferredPrompt(promptEvent);
    };

    // 5. Listen for successful installation event from OS/Browser
    const handleAppInstalled = () => {
      if (typeof window !== 'undefined') {
        window.__deferredPwaPrompt = null;
      }
      setDeferredPrompt(null);
      setIsInstalled(true);
      markAppInstalled();

      // Notify any listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pwa-installed-success'));
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (typeof window !== 'undefined') {
        window.__onPwaPromptReady = null;
      }
    };
  }, []);

  /**
   * Triggers the native browser install prompt (Android/Desktop Chromium)
   */
  const promptInstall = React.useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    let promptEvent =
      deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPwaPrompt : null);

    // If prompt is not yet ready, wait briefly for browser event heuristic
    if (!promptEvent && typeof window !== 'undefined') {
      const start = Date.now();
      while (Date.now() - start < 1200) {
        if (window.__deferredPwaPrompt) {
          promptEvent = window.__deferredPwaPrompt;
          setDeferredPrompt(promptEvent);
          break;
        }
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    if (!promptEvent) {
      return 'unavailable';
    }

    try {
      setIsPrompting(true);
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        markAppInstalled();
      }
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        window.__deferredPwaPrompt = null;
      }
      return choice.outcome;
    } catch (err) {
      console.warn('Install prompt error:', err);
      return 'unavailable';
    } finally {
      setIsPrompting(false);
    }
  }, [deferredPrompt]);

  /**
   * Attempts to launch the installed application
   */
  const openInstalledApp = React.useCallback((targetPath = '/') => {
    if (platformInfo.isAndroid) {
      return launchAndroidInstalledApp(targetPath);
    }
    return false;
  }, [platformInfo.isAndroid]);

  const canPrompt = Boolean(
    deferredPrompt || (typeof window !== 'undefined' && window.__deferredPwaPrompt)
  );

  return {
    isStandalone,
    isInstalled,
    canPrompt,
    isPrompting,
    platformInfo,
    promptInstall,
    openInstalledApp,
  };
}
