'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type GlobalLoaderContextValue = {
  showLoaderFor: (durationMs?: number) => string;
  startLoader: () => string;
  stopLoader: (id: string) => void;
};

const GlobalLoaderContext = createContext<GlobalLoaderContextValue | null>(null);

function createLoaderId() {
  return `loader-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function GlobalLoaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeLoaders, setActiveLoaders] = useState<string[]>([]);
  const navLoaderIdRef = useRef<string | null>(null);
  const navLoaderTimeoutRef = useRef<number | null>(null);

  const startLoader = useCallback(() => {
    const id = createLoaderId();
    setActiveLoaders((prev) => (prev.includes(id) ? prev : [...prev, id]));
    return id;
  }, []);

  const stopLoader = useCallback((id: string) => {
    setActiveLoaders((prev) => prev.filter((loaderId) => loaderId !== id));
  }, []);

  const showLoaderFor = useCallback(
    (durationMs = 450) => {
      const id = startLoader();
      window.setTimeout(() => {
        stopLoader(id);
      }, durationMs);
      return id;
    },
    [startLoader, stopLoader]
  );

  useEffect(() => {
    function clearPendingNavTimeout() {
      if (navLoaderTimeoutRef.current) {
        window.clearTimeout(navLoaderTimeoutRef.current);
        navLoaderTimeoutRef.current = null;
      }
    }

    function onDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (anchor.getAttribute('target') && anchor.getAttribute('target') !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const nextUrl = new URL(href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      const currentUrl = new URL(window.location.href);
      const sameRoute = nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search;
      if (sameRoute) return;

      if (navLoaderIdRef.current) return;
      navLoaderIdRef.current = startLoader();
      clearPendingNavTimeout();
      navLoaderTimeoutRef.current = window.setTimeout(() => {
        if (navLoaderIdRef.current) {
          stopLoader(navLoaderIdRef.current);
          navLoaderIdRef.current = null;
        }
        navLoaderTimeoutRef.current = null;
      }, 12000);
    }

    document.addEventListener('click', onDocumentClick, true);
    return () => {
      document.removeEventListener('click', onDocumentClick, true);
      clearPendingNavTimeout();
    };
  }, [startLoader, stopLoader]);

  useEffect(() => {
    if (!navLoaderIdRef.current) return;
    stopLoader(navLoaderIdRef.current);
    navLoaderIdRef.current = null;
    if (navLoaderTimeoutRef.current) {
      window.clearTimeout(navLoaderTimeoutRef.current);
      navLoaderTimeoutRef.current = null;
    }
  }, [pathname, searchParams, stopLoader]);

  const value = useMemo<GlobalLoaderContextValue>(
    () => ({ showLoaderFor, startLoader, stopLoader }),
    [showLoaderFor, startLoader, stopLoader]
  );

  const isLoading = activeLoaders.length > 0;

  return (
    <GlobalLoaderContext.Provider value={value}>
      {children}
      {isLoading ? <GlobalLoaderOverlay /> : null}
    </GlobalLoaderContext.Provider>
  );
}

export function useGlobalLoader() {
  const context = useContext(GlobalLoaderContext);
  if (!context) {
    throw new Error('useGlobalLoader must be used within GlobalLoaderProvider');
  }
  return context;
}

function GlobalLoaderOverlay() {
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-[#0f172a]/35 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#d5e1f4] bg-white/95 px-8 py-6 shadow-[0_24px_64px_rgba(14,46,92,0.28)]">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full border-[3px] border-[#cfe2ff] border-t-[#1e7ef2] animate-spin" />
          <div className="absolute inset-2 grid place-items-center overflow-hidden rounded-full border border-[#d6e2f4] bg-white p-1">
            <img src="/wrectifai_logo.png" alt="WrectifAI Loading" className="h-full w-full object-contain" />
          </div>
        </div>
        <p className="text-[13px] font-medium text-slate-700">Loading...</p>
      </div>
    </div>
  );
}
