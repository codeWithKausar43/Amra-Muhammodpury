import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isPwaStandalone,
  getPwaPlatformInfo,
  saveTargetRoute,
  getAndClearTargetRoute,
  markAppInstalled,
  isAppInstalledStorage,
  launchAndroidInstalledApp,
  PWA_TARGET_ROUTE_KEY,
  PWA_INSTALLED_KEY,
} from '@/lib/pwa/pwa-utils';

describe('PWA Utility Detection & Storage', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    delete (window as any).__IS_PWA_STANDALONE__;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('detects standard non-standalone browser by default', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(isPwaStandalone()).toBe(false);
  });

  it('detects display-mode: standalone correctly', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('display-mode: standalone'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(isPwaStandalone()).toBe(true);
  });

  it('detects iOS standalone via navigator.standalone', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window.navigator, 'standalone', {
      value: true,
      configurable: true,
    });

    expect(isPwaStandalone()).toBe(true);

    Object.defineProperty(window.navigator, 'standalone', {
      value: false,
      configurable: true,
    });
  });

  it('detects Android TWA / WebAPK via android-app referrer', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(document, 'referrer', {
      value: 'android-app://org.chromium.webapk.amramuhammodpury',
      configurable: true,
    });

    expect(isPwaStandalone()).toBe(true);

    Object.defineProperty(document, 'referrer', {
      value: '',
      configurable: true,
    });
  });

  it('detects platform info for Android', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
      configurable: true,
    });

    const info = getPwaPlatformInfo();
    expect(info.isAndroid).toBe(true);
    expect(info.isIos).toBe(false);
    expect(info.isInAppBrowser).toBe(false);
  });

  it('detects platform info for iOS', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      configurable: true,
    });

    const info = getPwaPlatformInfo();
    expect(info.isIos).toBe(true);
    expect(info.isAndroid).toBe(false);
  });

  it('detects in-app browsers like Facebook and Messenger', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 [FBAN/EMA;FBAV/340.0.0.9.112;]',
      configurable: true,
    });

    const info = getPwaPlatformInfo();
    expect(info.isInAppBrowser).toBe(true);
  });

  it('preserves deep link target route in storage and retrieves it', () => {
    saveTargetRoute('/organization/member?tab=directory');
    expect(localStorage.getItem(PWA_TARGET_ROUTE_KEY)).toBe('/organization/member?tab=directory');

    const retrieved = getAndClearTargetRoute();
    expect(retrieved).toBe('/organization/member?tab=directory');
    expect(localStorage.getItem(PWA_TARGET_ROUTE_KEY)).toBeNull();
  });

  it('does not store root / or source=pwa as target route', () => {
    saveTargetRoute('/');
    expect(localStorage.getItem(PWA_TARGET_ROUTE_KEY)).toBeNull();

    saveTargetRoute('/?source=pwa');
    expect(localStorage.getItem(PWA_TARGET_ROUTE_KEY)).toBeNull();
  });

  it('records and checks app installed status in storage', () => {
    expect(isAppInstalledStorage()).toBe(false);
    markAppInstalled();
    expect(isAppInstalledStorage()).toBe(true);
    expect(localStorage.getItem(PWA_INSTALLED_KEY)).toBe('true');
  });

  it('launches android installed app via Chrome intent on Android', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile',
      configurable: true,
    });

    const launched = launchAndroidInstalledApp('/organization/member');
    expect(launched).toBe(true);
  });

  it('does not trigger android intent on non-Android platform', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    });

    const launched = launchAndroidInstalledApp('/organization/member');
    expect(launched).toBe(false);
  });
});
