/**
 * PWA Utility Helpers
 * Provides reliable standalone detection, platform detection, and event hooks.
 */

export interface PwaPlatformInfo {
  isIos: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isInAppBrowser: boolean;
}

/**
 * Checks whether the current window is running in an installed standalone PWA.
 * Evaluates standard display-mode media queries and iOS Safari navigator.standalone.
 */
export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  const isStandaloneMedia =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches;

  const isIosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;

  const isAndroidTwa =
    typeof document !== 'undefined' &&
    typeof document.referrer === 'string' &&
    document.referrer.startsWith('android-app://');

  return Boolean(isStandaloneMedia || isIosStandalone || isAndroidTwa);
}

/**
 * Detects client device platform and browser environment.
 */
export function getPwaPlatformInfo(): PwaPlatformInfo {
  if (typeof window === 'undefined') {
    return {
      isIos: false,
      isAndroid: false,
      isDesktop: true,
      isInAppBrowser: false,
    };
  }

  const ua = navigator.userAgent || '';
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isDesktop = !isIos && !isAndroid;

  // In-app browsers often restrict or break PWA installation (Facebook, Messenger, Instagram, Line)
  const isInAppBrowser =
    /FBAN|FBAV|Instagram|Line|WhatsApp/i.test(ua) ||
    (isIos && !/Safari/i.test(ua) && !isPwaStandalone());

  return {
    isIos,
    isAndroid,
    isDesktop,
    isInAppBrowser,
  };
}

/**
 * Attempts to trigger or launch the installed Android PWA/WebAPK
 */
export function launchAndroidInstalledApp(): void {
  if (typeof window === 'undefined') return;
  try {
    const host = window.location.host;
    const path = window.location.pathname;
    const intentUrl = `intent://${host}${path}#Intent;scheme=https;action=android.intent.action.VIEW;end;`;
    window.location.href = intentUrl;
  } catch {}
}


