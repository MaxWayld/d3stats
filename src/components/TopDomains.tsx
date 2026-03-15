"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  formatLargeNumber,
  tokenAmount,
  shortenAddress,
  extractTLD,
  tldColor,
  type TokenItem,
} from "@/lib/doma-api";
import { useInView } from "@/hooks/useInView";

interface Props {
  tokens: TokenItem[];
  immediate?: boolean;
}

const GRID = "48px 1.5fr 1fr 1fr 1fr";

type SortKey = "holders" | "supply";
type SortDir = "asc" | "desc";

function getSupplyNum(token: TokenItem): number {
  if (token.total_supply && token.decimals) {
    return tokenAmount(token.total_supply, token.decimals);
  }
  if (token.total_supply) return parseFloat(token.total_supply) || 0;
  return 0;
}

export default function TopDomains({ tokens, immediate }: Props) {
  const inView = useInView();
  const ref = immediate ? undefined : inView.ref;
  const row = immediate
    ? () => ({} as React.CSSProperties)
    : inView.row;
  const [sortKey, setSortKey] = useState<SortKey>("holders");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [tldFilter, setTldFilter] = useState<string>("All");

  // Compute unique TLDs for filter tabs
  const tlds = useMemo(() => {
    const set = new Set<string>();
    tokens.forEach((t) => {
      if (t.symbol) set.add(extractTLD(t.symbol));
    });
    return Array.from(set).sort();
  }, [tokens]);

  // Filter by TLD
  const filtered = useMemo(() => {
    if (tldFilter === "All") return tokens;
    return tokens.filter((t) => t.symbol && extractTLD(t.symbol) === tldFilter);
  }, [tokens, tldFilter]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "holders") {
        cmp = parseInt(a.holders_count || "0") - parseInt(b.holders_count || "0");
      } else {
        cmp = getSupplyNum(a) - getSupplyNum(b);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "desc" ? " \u2193" : " \u2191";
  };

  return (
    <div ref={ref as React.RefObject<HTMLDivElement> | undefined}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3" style={row(0)}>
        <span className="text-[13px] font-medium text-text-secondary uppercase tracking-wider">
          Domains
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setTldFilter("All")}
            className={`text-[12px] px-2 py-1 rounded-md font-medium transition-colors ${
              tldFilter === "All"
                ? "text-text-primary bg-bg-card"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            All
          </button>
          {tlds.map((tld) => (
            <button
              key={tld}
              onClick={() => setTldFilter(tld)}
              className={`text-[12px] px-2 py-1 rounded-md font-medium transition-colors ${
                tldFilter === tld
                  ? "text-text-primary bg-bg-card"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {tld}
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
        <span
          className="cursor-pointer select-none hover:text-text-secondary transition-colors"
          onClick={() => handleSort("holders")}
        >
          Holders{sortIndicator("holders")}
        </span>
        <span
          className="cursor-pointer select-none hover:text-text-secondary transition-colors"
          onClick={() => handleSort("supply")}
        >
          Supply{sortIndicator("supply")}
        </span>
        <span>Address</span>
      </div>

      {/* Rows */}
      {sorted.length === 0 && (
        <p className="text-text-muted text-sm py-8 text-center">No domain tokens found</p>
      )}
      {sorted.map((token, i) => {
        const supply = token.total_supply && token.decimals
          ? formatLargeNumber(tokenAmount(token.total_supply, token.decimals))
          : token.total_supply
            ? formatLargeNumber(token.total_supply)
            : "\u2014";

        const tld = token.symbol ? extractTLD(token.symbol) : "";

        return (
          <div
            key={token.address_hash}
            className="row-interactive grid items-center py-3 border-b border-border/40 last:border-0"
            style={{ gridTemplateColumns: GRID, ...row(80 + Math.min(i, 12) * 40) }}
          >
            <span className="text-[13px] num text-text-muted">{i + 1}</span>
            <span className="text-[14px] font-medium text-text-primary tracking-tight truncate">
              <Link
                href={`/token/${token.address_hash}`}
                className="hover:text-accent transition-colors"
              >
                {token.symbol || token.name || "Unknown"}
              </Link>
              {tld && (
                <span className={`ml-1.5 text-[11px] font-normal ${tldColor(tld)}`}>
                  {tld}
                </span>
              )}
            </span>
            <span className="text-[13px] num text-text-primary">
              {token.holders_count ?? "\u2014"}
            </span>
            <span className="text-[13px] num text-text-secondary">
              {supply}
            </span>
            <span className="text-[13px] num text-text-muted">
              <a
                href={`https://explorer.doma.xyz/address/${token.address_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                {shortenAddress(token.address_hash)}
              </a>
            </span>
          </div>
        );
      })}
        </div>
      </div>
    </div>
  );
}
