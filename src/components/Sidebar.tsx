"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Globe, Wallet, ArrowLeftRight, Users, Scale } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Domains", href: "/domains", icon: Globe },
  { label: "Checker", href: "/wallet", icon: Wallet },
  { label: "Trades", href: "/trades", icon: ArrowLeftRight },
  { label: "Whales", href: "/whales", icon: Users },
  { label: "Compare", href: "/compare", icon: Scale },
];

interface Props {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: Props) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} />
      )}
      <aside className={`fixed left-0 top-0 z-40 flex h-screen w-[220px] flex-col border-r border-border bg-bg-primary transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        {/* Accent glow line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{
          background: "linear-gradient(to bottom, transparent 10%, #29b6f6 30%, #29b6f6 70%, transparent 90%)",
          boxShadow: "0 0 8px rgba(41,182,246,0.3), 0 0 20px rgba(41,182,246,0.1)",
        }}
      />

      <div className="px-5 pt-6 pb-8">
        <span className="text-sm font-semibold tracking-tight">
          <span className="text-accent">D3</span>
          <span className="text-text-primary">Stats</span>
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-[13px] transition-colors border-l-2 ${
                active
                  ? "bg-bg-card font-medium text-text-primary border-accent"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon size={15} className={active ? "text-accent" : "text-text-muted"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Chain status widget */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-green" style={{ animation: "pulseGlow 2s infinite" }} />
          Doma Chain
        </div>
      </div>

      <div className="px-4 pb-5">
        <div className="mb-3 h-px bg-border" />
        <p className="text-[11px] text-text-muted leading-relaxed">
          By{" "}
          <a href="https://x.com/MaxWayld" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
            Max Wayld
          </a>
        </p>
        <p className="text-[11px] text-text-muted leading-relaxed">
          for{" "}
          <a href="https://x.com/domaprotocol" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            Doma Protocol
          </a>
        </p>
      </div>
      </aside>
    </>
  );
}
