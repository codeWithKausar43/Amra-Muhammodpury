'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  isPwaStandalone,
  saveTargetRoute,
  getAndClearTargetRoute,
  markAppInstalled,
} from '@/lib/pwa/pwa-utils';

interface PwaInstallScreenProps {
  targetPath?: string;
}

// Lazy-load the installation screen so installed standalone users NEVER download this bundle
const LazyInstallScreen = dynamic<PwaInstallScreenProps>(
  () => import('./PwaInstallScreen'),
  {
    ssr: false,
    loading: () => <PwaSplashPlaceholder />,
  }
);

/**
 * Lightweight branded splash placeholder shown strictly during initial hydration tick
 * to guarantee ZERO flash of protected application content.
 */
function PwaSplashPlaceholder() {
  return (
    <div
      role="status"
      aria-label="অ্যাপ লোড হচ্ছে..."
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white select-none"
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
        <div className="absolute inset-0 rounded-3xl bg-brand-emerald/30 blur-xl animate-pulse" />
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-brand-charcoal p-2 border border-brand-emerald/40 shadow-2xl flex items-center justify-center">
          <Image
            src="/logos/app-logo.png"
            alt="মোহাম্মদপুর কমিউনিটি"
            fill
            sizes="96px"
            className="object-contain p-2"
            priority
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-brand-mint/90 tracking-wide">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-ping" />
        <span>মোহাম্মদপুর কমিউনিটি</span>
      </div>
    </div>
  );
}

interface PwaInstallGateProps {
  children: React.ReactNode;
}

function PwaInstallGateInner({ children }: PwaInstallGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Start with null during SSR to avoid hydration mismatch
  const [isStandalone, setIsStandalone] = React.useState<boolean | null>(null);

  // Compute full current route string
  const currentFullPath = React.useMemo(() => {
    const qs = searchParams?.toString();
    return `${pathname || '/'}${qs ? `?${qs}` : ''}`;
  }, [pathname, searchParams]);

  React.useEffect(() => {
    // Clean up any legacy unlock tokens from previous sessions
    try {
      localStorage.removeItem('amra_pwa_gate_unlocked');
      sessionStorage.removeItem('amra_pwa_gate_unlocked');
    } catch {}

    // 1. Synchronous client-side standalone verification
    const standalone = isPwaStandalone();
    setIsStandalone(standalone);

    if (standalone) {
      // User is inside the installed standalone PWA / APK
      markAppInstalled();

      // Check if a previously requested deep link destination was saved
      const savedTargetRoute = getAndClearTargetRoute();
      if (
        savedTargetRoute &&
        savedTargetRoute !== '/' &&
        savedTargetRoute !== currentFullPath &&
        !savedTargetRoute.startsWith('/?source=pwa')
      ) {
        // Automatically restore original requested destination
        router.replace(savedTargetRoute);
      }
    } else {
      // User is viewing via standard browser tab or in-app webview
      // Save current route for deep link restoration after installation
      if (currentFullPath && currentFullPath !== '/' && !currentFullPath.startsWith('/?source=pwa')) {
        saveTargetRoute(currentFullPath);
      }
    }

    // 2. Register Service Worker on window load
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .catch((err) => {
            console.warn('[PWA] Service worker registration notice:', err);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW, { once: true });
      }
    }

    // 3. Listen for display-mode transitions (e.g. desktop PWA launched, window popout)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const isNowStandalone = Boolean(e.matches || isPwaStandalone());
      setIsStandalone(isNowStandalone);
      if (isNowStandalone) {
        markAppInstalled();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    // 4. Re-check standalone when app gains focus or visibility
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const check = isPwaStandalone();
        if (check && !isStandalone) {
          setIsStandalone(true);
          markAppInstalled();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [router, currentFullPath, isStandalone]);

  // During SSR or initial client mounting tick:
  // Render lightweight branded splash shell to strictly prevent any content flash / leakage!
  if (isStandalone === null) {
    return <PwaSplashPlaceholder />;
  }

  // If running inside the installed standalone PWA / APK, grant full access
  if (isStandalone === true) {
    return <>{children}</>;
  }

  // Non-installed standard browser session:
  // Strictly display the mandatory installation screen with requested route preserved.
  return <LazyInstallScreen targetPath={currentFullPath} />;
}

export function PwaInstallGate({ children }: PwaInstallGateProps) {
  return (
    <React.Suspense fallback={<PwaSplashPlaceholder />}>
      <PwaInstallGateInner>{children}</PwaInstallGateInner>
    </React.Suspense>
  );
}
