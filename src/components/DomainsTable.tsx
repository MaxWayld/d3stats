"use client";

import { useState } from "react";
import Link from "next/link";
import {
  formatLargeNumber,
  shortenAddress,
  tokenAmount,
  extractTLD,
  tldColor,
  isDomainToken,
  encodePageParams,
  type TokenItem,
} from "@/lib/doma-api";
import { useInView } from "@/hooks/useInView";

const GRID = "48px 1.5fr 0.5fr 1fr 1fr 1fr";

interface Props {
  initialTokens: TokenItem[];
  hasMore: boolean;
  nextPageParams: Record<string, string | number | boolean | null> | null;
}

export default function DomainsTable({ initialTokens, hasMore: initialHasMore, nextPageParams: initialNextParams }: Props) {
  const [tokens, setTokens] = useState(initialTokens);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextParams, setNextParams] = useState(initialNextParams);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortKey, setSortKey] = useState<"holders" | "supply">("holders");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [tldFilter, setTldFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const { ref, row } = useInView(0);

  // Load more pages through our proxy
  async function loadMore() {
    if (!nextParams || loadingMore) return;
    setLoadingMore(true);

    try {
      const qs = encodePageParams(nextParams);
      const res = await fetch(`/api/explorer/tokens?type=ERC-20&sort=holders_count&order=desc&${qs}`);
      const data = await res.json();

      if (data.items) {
        const newDomains = (data.items as TokenItem[]).filter(isDomainToken);
        setTokens((prev) => [...prev, ...newDomains]);
        setNextParams(data.next_page_params || null);
        setHasMore(data.next_page_params !== null);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }

  // Compute TLD tabs from data
  const tldCounts: Record<string, number> = {};
  for (const t of tokens) {
    if (!t.symbol) continue;
    const tld = extractTLD(t.symbol);
    tldCounts[tld] = (tldCounts[tld] || 0) + 1;
  }
  const tldTabs = ["All", ...Object.keys(tldCounts).sort((a, b) => tldCounts[b] - tldCounts[a])];

  // Filter by TLD
  const filtered = tokens.filter((t) => {
    if (tldFilter === "All") return true;
    return t.symbol ? extractTLD(t.symbol) === tldFilter : false;
  });

  // Filter by search
  const searchFiltered = filtered.filter((t) =>
    !search || (t.symbol?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  // Sort
  const sorted = [...searchFiltered].sort((a, b) => {
    const mult = sortDir === "desc" ? -1 : 1;
    if (sortKey === "holders") {
      return mult * ((parseInt(a.holders_count || "0")) - (parseInt(b.holders_count || "0")));
    }
    return mult * (tokenAmount(a.total_supply || "0", a.decimals) - tokenAmount(b.total_supply || "0", b.decimals));
  });

  function toggleSort(key: "holders" | "supply") {
    if (sortKey === key) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sortArrow = (key: string) => sortKey === key ? (sortDir === "desc" ? " \u2193" : " \u2191") : "";

  return (
    <div ref={ref}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3" style={row(0)}>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-text-secondary uppercase tracking-wider">
            Domains
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search domains..."
            className="h-8 px-3 text-[13px] rounded-md bg-bg-surface border border-border text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors w-[200px]"
          />
        </div>
        <div className="flex gap-1">
          {tldTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setTldFilter(tab)}
              className={`text-[12px] px-2 py-1 rounded-md transition-colors ${
                tldFilter === tab
                  ? "text-text-primary font-medium bg-bg-card"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {tab === "All" ? "All" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table header + rows */}
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
      <div
        className="grid items-center py-2 border-b border-border text-[11px] text-text-muted uppercase tracking-wider"
        style={{ gridTemplateColumns: GRID, ...row(40) }}
      >
        <span>#</span>
        <span>Domain</span>
        <span>TLD</span>
        <span className="cursor-pointer hover:text-text-secondary select-none" onClick={() => toggleSort("holders")}>
          Holders{sortArrow("holders")}
        </span>
        <span className="cursor-pointer hover:text-text-secondary select-none" onClick={() => toggleSort("supply")}>
          Supply{sortArrow("supply")}
        </span>
        <span>Address</span>
      </div>

      {/* Rows */}
      {sorted.length === 0 && (
        <p className="text-text-muted text-sm py-8 text-center">No domain tokens found</p>
      )}

      {sorted.map((token, i) => {
        const tld = token.symbol ? extractTLD(token.symbol) : "";
        const supply = tokenAmount(token.total_supply || "0", token.decimals);

        return (
          <div
            key={token.address_hash}
            className="row-interactive grid items-center py-3 border-b border-border/40 last:border-0 cursor-pointer"
            style={{ gridTemplateColumns: GRID, ...row(60 + Math.min(i, 15) * 30) }}
          >
            <span className="text-[13px] num text-text-muted">{i + 1}</span>
            <Link
              href={`/token/${token.address_hash}`}
              className="text-[14px] font-medium text-text-primary tracking-tight truncate hover:text-accent transition-colors"
            >
              {token.symbol}
            </Link>
            <span className={`text-[12px] ${tldColor(tld)}`}>
              {tld}
            </span>
            <span className="text-[13px] num text-text-primary">
              {formatLargeNumber(token.holders_count || "0")}
            </span>
            <span className="text-[13px] num text-text-secondary">
              {formatLargeNumber(supply)}
            </span>
            <a
              href={`https://explorer.doma.xyz/address/${token.address_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-text-muted hover:text-accent transition-colors"
            >
              {shortenAddress(token.address_hash)}
            </a>
          </div>
        );
      })}
        </div>
      </div>

      {/* Load More button */}
      {hasMore && (
        <div className="flex justify-center pt-6 pb-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className={`btn-accent h-10 px-8 rounded-lg text-[13px] font-medium transition-all ${
              loadingMore
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
