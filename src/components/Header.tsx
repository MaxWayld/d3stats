"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import SearchDropdown from "./SearchDropdown";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/domains": "Domains",
  "/wallet": "Wallet Checker",
  "/trades": "Trades",
  "/whales": "Top Accounts",
};

export default function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  const isDetailPage = pathname.startsWith("/token/") || pathname.startsWith("/address/");
  const pageTitle = TITLES[pathname] || (pathname.startsWith("/token/") ? "Token Detail" : pathname.startsWith("/address/") ? "Address Detail" : "Dashboard");

  useEffect(() => { setShow(true); }, []);

  return (
    <header
      className="sticky top-0 z-30 h-12 flex items-center justify-between px-6 bg-bg-primary/80 backdrop-blur-md border-b border-border"
      style={{
        opacity: show ? 1 : 0,
        transition: "opacity 0.5s ease 100ms",
      }}
    >
      <div className="flex items-center gap-1.5 text-sm">
        {onMenuToggle && (
          <button onClick={onMenuToggle} className="md:hidden text-text-secondary hover:text-text-primary mr-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        {isDetailPage && (
          <>
            <Link href="/" className="text-text-muted hover:text-text-secondary transition-colors">Dashboard</Link>
            <span className="text-text-muted">/</span>
          </>
        )}
        <span className="text-text-secondary">{pageTitle}</span>
      </div>

      <SearchDropdown />

      <div className="flex items-center gap-2">
        <span className="hidden md:block text-[12px] text-text-muted">Doma</span>
        <span className="w-1.5 h-1.5 rounded-full bg-green" style={{ animation: "pulseGlow 2s infinite" }} />
        <button
          onClick={() => window.location.reload()}
          className="hidden md:block text-text-muted hover:text-text-secondary transition-colors"
          title="Refresh data"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <div className="w-px h-4 bg-border" />
        <a
          href="https://app.doma.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gradient h-7 px-3 text-[12px] flex items-center gap-1 rounded-lg"
        >
          Launch App
        </a>
      </div>
    </header>
  );
}
