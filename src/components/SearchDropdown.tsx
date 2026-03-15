"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { shortenAddress, type SearchResult } from "@/lib/doma-api";

export default function SearchDropdown() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const items = await fetch(`/api/explorer/search?q=${encodeURIComponent(q)}`).then(r => r.json()).then(d => d.items || []);
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    setResults([]);

    if (result.type === "token" && result.address_hash) {
      router.push(`/token/${result.address_hash}`);
    } else if (result.type === "address" && result.address_hash) {
      router.push(`/address/${result.address_hash}`);
    } else if (result.type === "transaction" && result.address_hash) {
      window.open(`https://explorer.doma.xyz/tx/${result.address_hash}`, "_blank");
    } else if (result.type === "block" && result.address_hash) {
      window.open(`https://explorer.doma.xyz/block/${result.address_hash}`, "_blank");
    } else if (result.token_url) {
      router.push(result.token_url);
    } else if (result.address_url) {
      router.push(result.address_url);
    }
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      token: "bg-accent/15 text-accent",
      address: "bg-blue-500/15 text-blue-400",
      transaction: "bg-green/15 text-green",
      block: "bg-orange-500/15 text-text-muted",
    };
    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${
          colors[type] || "bg-bg-surface text-text-muted"
        }`}
      >
        {type === "transaction" ? "tx" : type}
      </span>
    );
  };

  return (
    <div ref={containerRef} className="relative max-w-[360px] w-full">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted z-10"
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search... (Ctrl+K)"
        data-search-input
        className="w-full h-8 pl-8 pr-3 text-[13px] rounded-md bg-bg-surface border border-border text-text-primary placeholder:text-text-muted outline-none focus:border-text-muted transition-colors"
      />

      {open && (query.trim() || loading) && (
        <div className="absolute top-full left-0 right-0 z-50 bg-bg-card border border-border rounded-lg shadow-lg mt-1 max-h-[300px] overflow-y-auto">
          {loading && (
            <div className="px-3 py-3 text-[13px] text-text-muted">
              Searching...
            </div>
          )}

          {!loading && results.length === 0 && query.trim() && (
            <div className="px-3 py-3 text-[13px] text-text-muted">
              No results
            </div>
          )}

          {!loading &&
            results.map((r, i) => (
              <button
                key={`${r.address_hash || r.name}-${i}`}
                onClick={() => handleSelect(r)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-card-hover cursor-pointer text-left transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] text-text-primary truncate block">
                    {r.name || r.symbol || "Unknown"}
                  </span>
                  {r.address_hash && (
                    <span className="text-[11px] text-text-muted">
                      {shortenAddress(r.address_hash)}
                    </span>
                  )}
                </div>
                {r.symbol && r.name && (
                  <span className="text-[11px] text-text-muted flex-shrink-0">
                    {r.symbol}
                  </span>
                )}
                {typeBadge(r.type)}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
