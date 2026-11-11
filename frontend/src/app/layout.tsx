import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/providers/AppProviders';
import { PwaInstallGate } from '@/features/pwa/components/PwaInstallGate';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#087A55',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: 'আমরা মোহাম্মদপুরী',
    template: '%s | আমরা মোহাম্মদপুরী',
  },
  description: 'আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন সংস্থা ও সামাজিক প্ল্যাটফর্ম।',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'আমরা মোহাম্মদপুরী',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '48x48' },
      { url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Suppress external browser extension runtime crashes (e.g. Urban VPN, AdBlockers, password managers)
                  // preventing them from triggering the Next.js development error modal.
                  window.addEventListener('error', function(event) {
                    var fn = event.filename || '';
                    var msg = event.message || '';
                    if (
                      fn.indexOf('chrome-extension://') !== -1 ||
                      fn.indexOf('moz-extension://') !== -1 ||
                      msg.indexOf('M_ID') !== -1 ||
                      msg.indexOf('executors/200.js') !== -1
                    ) {
                      event.stopImmediatePropagation();
                      event.preventDefault();
                      return true;
                    }
                  }, true);

                  window.addEventListener('unhandledrejection', function(event) {
                    var stack = (event.reason && (event.reason.stack || event.reason.message)) || '';
                    if (
                      stack.indexOf('chrome-extension://') !== -1 ||
                      stack.indexOf('moz-extension://') !== -1 ||
                      stack.indexOf('M_ID') !== -1 ||
                      stack.indexOf('executors/200.js') !== -1
                    ) {
                      event.stopImmediatePropagation();
                      event.preventDefault();
                    }
                  }, true);

                  var badAttrs = ['bis_skin_checked', 'bis_register', 'data-gr-ext-installed', 'data-new-gr-c-s-check-loaded', 'cz-shortcut-listen'];
                  var origSet = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, val) {
                    if (name && badAttrs.indexOf(name) !== -1) return;
                    return origSet.apply(this, arguments);
                  };
                  var clean = function(node) {
                    if (node && node.nodeType === 1) {
                      for (var i = 0; i < badAttrs.length; i++) {
                        if (node.hasAttribute(badAttrs[i])) node.removeAttribute(badAttrs[i]);
                      }
                      if (node.querySelectorAll) {
                        for (var i = 0; i < badAttrs.length; i++) {
                          var els = node.querySelectorAll('[' + badAttrs[i] + ']');
                          for (var j = 0; j < els.length; j++) {
                            els[j].removeAttribute(badAttrs[i]);
                          }
                        }
                      }
                    }
                  };
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && badAttrs.indexOf(m.attributeName) !== -1) {
                        m.target.removeAttribute(m.attributeName);
                      } else if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                          clean(m.addedNodes[j]);
                        }
                      }
                    }
                  });
                  observer.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: badAttrs,
                    childList: true,
                    subtree: true,
                  });
                } catch(e) {}
              })();

              // Early PWA Standalone Detection, Install Prompt Capture & Service Worker Registration
              (function() {
                try {
                  var isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                                     window.matchMedia('(display-mode: fullscreen)').matches ||
                                     window.matchMedia('(display-mode: minimal-ui)').matches ||
                                     navigator.standalone === true ||
                                     (document.referrer && document.referrer.indexOf('android-app://') === 0);
                  window.__IS_PWA_STANDALONE__ = isStandalone;
                  window.__deferredPwaPrompt = null;
                  window.addEventListener('beforeinstallprompt', function(e) {
                    e.preventDefault();
                    window.__deferredPwaPrompt = e;
                    if (window.__onPwaPromptReady) {
                      try {
                        window.__onPwaPromptReady(e);
                      } catch (err) {}
                    }
                  });
                  if ('serviceWorker' in navigator) {
                    try {
                      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function() {});
                    } catch (err) {}
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased min-h-screen bg-slate-50 dark:bg-brand-charcoal-dark text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <AppProviders>
          <PwaInstallGate>{children}</PwaInstallGate>
        </AppProviders>
      </body>
    </html>
  );
}
