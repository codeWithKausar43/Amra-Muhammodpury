import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isPwaStandalone, getPwaPlatformInfo } from '@/lib/pwa/pwa-utils';

describe('PWA Utility Detection', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.restoreAllMocks();
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

  it('detects platform info for Android', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
      configurable: true,
    });

    const info = getPwaPlatformInfo();
    expect(info.isAndroid).toBe(true);
    expect(info.isIos).toBe(false);
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
});

