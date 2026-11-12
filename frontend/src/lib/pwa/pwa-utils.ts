/**
 * PWA Utility Helpers
 * Provides reliable standalone detection, platform detection, deep linking storage, and event hooks.
 */

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
    __IS_PWA_STANDALONE__?: boolean;
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
    __onPwaPromptReady?: ((e: BeforeInstallPromptEvent) => void) | null;
  }
}

export interface PwaPlatformInfo {
  isIos: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isInAppBrowser: boolean;
}

export const PWA_TARGET_ROUTE_KEY = 'amra_pwa_target_route';
export const PWA_INSTALLED_KEY = 'amra_pwa_installed';

/**
 * Checks whether the current window is running in an installed standalone PWA.
 * Evaluates standard display-mode media queries and iOS Safari navigator.standalone.
 */
export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Cached early detection from <head> script
  if (window.__IS_PWA_STANDALONE__ === true) {
    return true;
  }

  // 2. Active app session flag
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('amra_is_standalone') === 'true') {
    window.__IS_PWA_STANDALONE__ = true;
    return true;
  }

  // 3. Standard CSS display-mode media query checks
  const isStandaloneMedia =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;

  // 4. iOS Safari standalone mode
  const isIosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;

  // 5. Android Trusted Web Activity / WebAPK referrer check
  const isAndroidTwa =
    typeof document !== 'undefined' &&
    typeof document.referrer === 'string' &&
    document.referrer.startsWith('android-app://');

  // 6. Android WebView detection (APK wrapper apps)
  // Android WebViews include "; wv)" in User-Agent string
  const ua = navigator.userAgent || '';
  const isAndroidWebView =
    /Android/i.test(ua) && /; wv\)/.test(ua);

  const standalone = Boolean(isStandaloneMedia || isIosStandalone || isAndroidTwa || isAndroidWebView);
  if (standalone) {
    window.__IS_PWA_STANDALONE__ = true;
    try {
      sessionStorage.setItem('amra_is_standalone', 'true');
    } catch {}
  }
  return standalone;
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
  // Broaden Android detection: include common Android UA variants and touch-based mobile hint
  const isAndroidUa = /Android/i.test(ua);
  // Extra fallback: coarse pointer + touch = likely mobile (catches some Android tablets with uncommon UA)
  const isTouchMobile =
    !isIos &&
    typeof navigator !== 'undefined' &&
    navigator.maxTouchPoints > 0 &&
    window.matchMedia('(pointer: coarse)').matches &&
    // Exclude large-screen touch desktops (e.g. Surface)
    window.screen.width <= 1024;
  const isAndroid = isAndroidUa || isTouchMobile;
  const isDesktop = !isIos && !isAndroid;

  // In-app browsers restrict or break PWA installation (Facebook, Messenger, Instagram, Line, WhatsApp)
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
 * Attempts to launch installed WebAPK on Android devices using Chrome intent scheme.
 */
export function launchAndroidInstalledApp(path = '/'): boolean {
  if (typeof window === 'undefined') return false;
  const isAndroid = /Android/i.test(navigator.userAgent || '');
  if (!isAndroid) return false;

  try {
    const host = window.location.host;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const intentUrl = `intent://${host}${cleanPath}#Intent;scheme=https;package=com.android.chrome;end;`;
    window.location.href = intentUrl;
    return true;
  } catch (err) {
    console.warn('[PWA] Could not trigger Android intent:', err);
    return false;
  }
}

/**
 * Opens current URL in external Chrome browser from Android In-App Browser
 */
export function openInExternalChrome(path?: string): void {
  if (typeof window === 'undefined') return;
  const host = window.location.host;
  const target = path || (window.location.pathname + window.location.search + window.location.hash);
  const cleanPath = target.startsWith('/') ? target : `/${target}`;
  const intentUrl = `intent://${host}${cleanPath}#Intent;scheme=https;package=com.android.chrome;end;`;
  window.location.href = intentUrl;
}

/**
 * Stores destination URL for restoring once launched inside standalone PWA.
 */
export function saveTargetRoute(url?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const route = url || (window.location.pathname + window.location.search + window.location.hash);
    if (route && route !== '/' && !route.startsWith('/?source=pwa')) {
      localStorage.setItem(PWA_TARGET_ROUTE_KEY, route);
    }
  } catch {}
}

/**
 * Retrieves and clears destination URL.
 */
export function getAndClearTargetRoute(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const route = localStorage.getItem(PWA_TARGET_ROUTE_KEY);
    if (route) {
      localStorage.removeItem(PWA_TARGET_ROUTE_KEY);
      return route;
    }
  } catch {}
  return null;
}

/**
 * Marks that the application has been installed on this device.
 */
export function markAppInstalled(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PWA_INSTALLED_KEY, 'true');
  } catch {}
}

/**
 * Clears the stored installation flag so the user can re-install.
 */
export function clearAppInstalledStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PWA_INSTALLED_KEY);
  } catch {}
}

/**
 * Checks if the application was previously marked as installed.
 */
export function isAppInstalledStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PWA_INSTALLED_KEY) === 'true';
  } catch {
    return false;
  }
}
