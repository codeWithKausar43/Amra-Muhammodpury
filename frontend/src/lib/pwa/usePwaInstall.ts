'use client';

import * as React from 'react';
import { isPwaStandalone, getPwaPlatformInfo, PwaPlatformInfo } from './pwa-utils';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
    __onPwaPromptReady?: ((e: BeforeInstallPromptEvent) => void) | null;
  }
}

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
    // 1. Initial check
    const initialStandalone = isPwaStandalone();
    setIsStandalone(initialStandalone);
    setIsInstalled(initialStandalone);
    setPlatformInfo(getPwaPlatformInfo());

    // Check early captured prompt from head script
    if (typeof window !== 'undefined') {
      if (window.__deferredPwaPrompt) {
        setDeferredPrompt(window.__deferredPwaPrompt);
      }
      window.__onPwaPromptReady = (e: BeforeInstallPromptEvent) => {
        setDeferredPrompt(e);
      };
    }

    // 2. Listen to display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setIsInstalled(true);
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleMediaChange);
    }

    // 3. Capture native install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent automatic mini-infobar on mobile Chrome
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      if (typeof window !== 'undefined') {
        window.__deferredPwaPrompt = promptEvent;
      }
      setDeferredPrompt(promptEvent);
    };

    // 4. Listen for successful installation event
    const handleAppInstalled = () => {
      if (typeof window !== 'undefined') {
        window.__deferredPwaPrompt = null;
        window.dispatchEvent(new CustomEvent('pwa-unlock-gate'));
      }
      setDeferredPrompt(null);
      setIsInstalled(true);
      // Wait a moment for OS shortcut to register, then check standalone
      setTimeout(() => {
        setIsStandalone(isPwaStandalone());
      }, 1000);
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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pwa-unlock-gate'));
        }
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

  return {
    isStandalone,
    isInstalled,
    canInstallNatively: Boolean(
      deferredPrompt || (typeof window !== 'undefined' && window.__deferredPwaPrompt)
    ),
    platformInfo,
    isPrompting,
    promptInstall,
  };
}

