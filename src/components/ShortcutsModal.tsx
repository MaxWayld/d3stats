"use client";
import { useState, useEffect } from "react";

const SHORTCUTS = [
  { key: "/", label: "Focus search" },
  { key: "D", label: "Dashboard" },
  { key: "O", label: "Domains" },
  { key: "W", label: "Wallet Checker" },
  { key: "T", label: "Trades" },
  { key: "H", label: "Top Accounts" },
  { key: "?", label: "This help" },
  { key: "Esc", label: "Close" },
];

export default function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-bg-card border border-border rounded-xl p-6 w-[320px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-text-primary mb-4">Keyboard Shortcuts</h3>
        <div className="space-y-2">
          {SHORTCUTS.map(s => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-[13px] text-text-secondary">{s.label}</span>
              <kbd className="text-[11px] px-2 py-0.5 rounded bg-bg-surface border border-border text-text-muted font-mono">{s.key}</kbd>
            </div>
          ))}
        </div>
        <button onClick={() => setOpen(false)} className="mt-4 text-[12px] text-text-muted hover:text-text-secondary transition-colors w-full text-center">
          Press Esc or ? to close
        </button>
      </div>
    </div>
  );
}
