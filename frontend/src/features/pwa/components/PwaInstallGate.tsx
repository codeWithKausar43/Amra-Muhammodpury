'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { isPwaStandalone } from '@/lib/pwa/pwa-utils';

interface PwaInstallScreenProps {
  onUnlock?: () => void;
}

// Lazy-load the installation screen so installed users NEVER download this chunk
const LazyInstallScreen = dynamic<PwaInstallScreenProps>(
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
  const [isGateUnlocked, setIsGateUnlocked] = React.useState<boolean>(false);

  const unlockGate = React.useCallback(() => {
    setIsGateUnlocked(true);
    try {
      sessionStorage.setItem('amra_pwa_gate_unlocked', 'true');
      localStorage.setItem('amra_pwa_gate_unlocked', 'true');
    } catch {}
  }, []);

  React.useEffect(() => {
    // 1. Synchronous check on client mount
    const standalone = isPwaStandalone();
    setIsStandalone(standalone);

    // 2. Check if previously unlocked in this browser session
    try {
      const isUnlocked =
        sessionStorage.getItem('amra_pwa_gate_unlocked') === 'true' ||
        localStorage.getItem('amra_pwa_gate_unlocked') === 'true';
      if (isUnlocked) {
        setIsGateUnlocked(true);
      }
    } catch {}

    // 3. Non-blocking service worker registration on window load
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

    // 4. Listen for display-mode changes (e.g. desktop PWA launched from browser)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsStandalone(Boolean(e.matches || isPwaStandalone()));
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    // 5. Listen for unlock event and appinstalled event
    const handleUnlockEvent = () => {
      unlockGate();
    };
    window.addEventListener('pwa-unlock-gate', handleUnlockEvent);
    window.addEventListener('appinstalled', handleUnlockEvent);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener('pwa-unlock-gate', handleUnlockEvent);
      window.removeEventListener('appinstalled', handleUnlockEvent);
    };
  }, [unlockGate]);

  // During SSR or initial mount tick, avoid layout shifts
  if (isStandalone === null) {
    return <>{children}</>;
  }

  // If running inside the installed standalone PWA OR user has unlocked the gate, render main application interface
  if (isStandalone || isGateUnlocked) {
    return <>{children}</>;
  }

  // Non-installed regular browser session: display dedicated installation screen
  return <LazyInstallScreen onUnlock={unlockGate} />;
}
