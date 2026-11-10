'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { isPwaStandalone } from '@/lib/pwa/pwa-utils';

// Lazy-load the installation screen so installed users NEVER download this chunk
const LazyInstallScreen = dynamic(
  () => import('./PwaInstallScreen'),
  {
    ssr: false,
    loading: () => null,
  }
);

interface PwaInstallGateProps {
  children: React.ReactNode;
}

export function PwaInstallGate({ children }: PwaInstallGateProps) {
  // Start with null during SSR to avoid hydration mismatch
  const [isStandalone, setIsStandalone] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // 1. Synchronous check on client mount
    const standalone = isPwaStandalone();
    setIsStandalone(standalone);

    // 2. Non-blocking service worker registration on window load
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .catch((err) => {
            console.warn('[PWA] Service worker registration warning:', err);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW, { once: true });
      }
    }

    // 3. Listen for display-mode changes (e.g. desktop PWA launched from browser)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsStandalone(Boolean(e.matches || isPwaStandalone()));
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      setTimeout(() => {
        setIsStandalone(isPwaStandalone());
      }, 500);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // During SSR or initial mount tick, avoid layout shifts
  if (isStandalone === null) {
    return <>{children}</>;
  }

  // If running inside the installed standalone PWA, render main application interface
  if (isStandalone) {
    return <>{children}</>;
  }

  // Non-installed regular browser session: display dedicated installation screen
  return <LazyInstallScreen />;
}

