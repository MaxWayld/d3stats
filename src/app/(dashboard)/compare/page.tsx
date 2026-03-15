"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { formatLargeNumber, tokenAmount, type TokenItem, type TokenCounters } from "@/lib/doma-api";

const API = "/api/explorer";

interface DomainData {
  token: TokenItem;
  counters: TokenCounters;
}

interface SearchResultItem {
  address_hash?: string;
  name?: string;
  symbol?: string;
  type: string;
}

export default function ComparePage() {
  const [slots, setSlots] = useState<(DomainData | null)[]>([null, null, null]);
  const [queries, setQueries] = useState<string[]>(["", "", ""]);
  const [dropdowns, setDropdowns] = useState<SearchResultItem[][]>([[], [], []]);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);
  const debounceRefs = useRef<(ReturnType<typeof setTimeout> | null)[]>([null, null, null]);

  useEffect(() => {
    return () => {
      debounceRefs.current.forEach(t => { if (t) clearTimeout(t); });
    };
  }, []);

  const searchDomain = useCallback(async (q: string, slotIndex: number) => {
    if (!q.trim()) {
      setDropdowns((prev) => {
        const next = [...prev];
        next[slotIndex] = [];
        return next;
      });
      return;
    }
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const items: SearchResultItem[] = (data.items || []).filter(
        (r: SearchResultItem) => r.type === "token" && r.address_hash
      );
      setDropdowns((prev) => {
        const next = [...prev];
        next[slotIndex] = items;
        return next;
      });
    } catch {
      setDropdowns((prev) => {
        const next = [...prev];
        next[slotIndex] = [];
        return next;
      });
    }
  }, []);

  const handleInputChange = (value: string, slotIndex: number) => {
    setQueries((prev) => {
      const next = [...prev];
      next[slotIndex] = value;
      return next;
    });
    if (debounceRefs.current[slotIndex]) clearTimeout(debounceRefs.current[slotIndex]!);
    debounceRefs.current[slotIndex] = setTimeout(() => searchDomain(value, slotIndex), 300);
  };

  const selectToken = async (item: SearchResultItem, slotIndex: number) => {
    if (!item.address_hash) return;
    setLoadingSlot(slotIndex);
    setDropdowns((prev) => {
      const next = [...prev];
      next[slotIndex] = [];
      return next;
    });
    setQueries((prev) => {
      const next = [...prev];
      next[slotIndex] = item.symbol || item.name || "";
      return next;
    });

    try {
      const [tokenRes, countersRes] = await Promise.all([
        fetch(`${API}/tokens/${item.address_hash}`).then((r) => r.json()),
        fetch(`${API}/tokens/${item.address_hash}/counters`).then((r) => r.json()),
      ]);
      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = { token: tokenRes as TokenItem, counters: countersRes as TokenCounters };
        return next;
      });
    } catch {
      setSlots(prev => {
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
    } finally {
      setLoadingSlot(null);
    }
  };

  const clearSlot = (slotIndex: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    setQueries((prev) => {
      const next = [...prev];
      next[slotIndex] = "";
      return next;
    });
  };

  const filledSlots = slots.filter((s): s is DomainData => s !== null);

  // Determine winners per metric
  function bestIndex(extractor: (d: DomainData) => number, higherIsBetter = true) {
    if (filledSlots.length < 2) return -1;
    const values = slots.map((s) => (s ? extractor(s) : -Infinity));
    const best = higherIsBetter ? Math.max(...values.filter((v) => v !== -Infinity)) : Math.min(...values.filter((v) => v !== -Infinity));
    return values.indexOf(best);
  }

  const holdersExtractor = (d: DomainData) => parseInt(d.counters.token_holders_count) || 0;
  const transfersExtractor = (d: DomainData) => parseInt(d.counters.transfers_count) || 0;
  const supplyExtractor = (d: DomainData) => tokenAmount(d.token.total_supply || "0", d.token.decimals);
  const concentrationExtractor = (d: DomainData) => {
    const holders = parseInt(d.counters.token_holders_count) || 1;
    const transfers = parseInt(d.counters.transfers_count) || 0;
    return transfers / holders;
  };

  const bestHolders = bestIndex(holdersExtractor);
  const bestTransfers = bestIndex(transfersExtractor);
  const bestSupply = bestIndex(supplyExtractor);
  const bestConcentration = bestIndex(concentrationExtractor);

  const metrics: { label: string; extractor: (d: DomainData) => string; bestIdx: number }[] = [
    {
      label: "Holders",
      extractor: (d) => formatLargeNumber(parseInt(d.counters.token_holders_count) || 0),
      bestIdx: bestHolders,
    },
    {
      label: "Transfers",
      extractor: (d) => formatLargeNumber(parseInt(d.counters.transfers_count) || 0),
      bestIdx: bestTransfers,
    },
    {
      label: "Total Supply",
      extractor: (d) => formatLargeNumber(tokenAmount(d.token.total_supply || "0", d.token.decimals)),
      bestIdx: bestSupply,
    },
    {
      label: "Activity Ratio",
      extractor: (d) => {
        const holders = parseInt(d.counters.token_holders_count) || 1;
        const transfers = parseInt(d.counters.transfers_count) || 0;
        return (transfers / holders).toFixed(2);
      },
      bestIdx: bestConcentration,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-heading">Compare Domains</h1>
        <p className="text-text-muted text-sm mt-1">
          Select 2-3 domain tokens to compare side-by-side
        </p>
      </div>

      {/* Search Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((slotIndex) => (
          <div key={slotIndex} className="relative">
            <label className="text-[11px] text-text-muted uppercase tracking-wider mb-1.5 block">
              Domain {slotIndex + 1}{slotIndex < 2 ? " *" : " (optional)"}
            </label>
            <div className="relative">
              <input
                type="text"
                value={queries[slotIndex]}
                onChange={(e) => handleInputChange(e.target.value, slotIndex)}
                placeholder="Search domain..."
                className="w-full h-9 px-3 text-[13px] rounded-md bg-bg-surface border border-border text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors"
              />
              {slots[slotIndex] && (
                <button
                  onClick={() => clearSlot(slotIndex)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-[13px]"
                >
                  ×
                </button>
              )}
            </div>
            {loadingSlot === slotIndex && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-bg-card border border-border rounded-lg p-3">
                <span className="text-[13px] text-text-muted">Loading...</span>
              </div>
            )}
            {dropdowns[slotIndex].length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-bg-card border border-border rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                {dropdowns[slotIndex].map((item, i) => (
                  <button
                    key={`${item.address_hash}-${i}`}
                    onClick={() => selectToken(item, slotIndex)}
                    className="w-full text-left px-3 py-2 hover:bg-bg-card-hover text-[13px] text-text-primary transition-colors"
                  >
                    <span className="font-medium">{item.symbol || item.name}</span>
                    {item.symbol && item.name && (
                      <span className="text-text-muted ml-2 text-[11px]">{item.name}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      {filledSlots.length >= 2 && (
        <div className="card-primary p-6 rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[11px] text-text-muted uppercase tracking-wider py-3 pr-4 w-[140px]">
                  Metric
                </th>
                {slots.map((slot, idx) =>
                  slot ? (
                    <th key={idx} className="text-left text-[14px] py-3 px-4 font-medium">
                      <span className={idx === 0 ? "text-accent" : "text-text-primary"}>
                        {slot.token.symbol || slot.token.name}
                      </span>
                    </th>
                  ) : null
                )}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.label} className="border-b border-border/40 last:border-0">
                  <td className="text-[12px] text-text-muted py-3 pr-4">{metric.label}</td>
                  {slots.map((slot, idx) =>
                    slot ? (
                      <td
                        key={idx}
                        className={`text-[14px] num py-3 px-4 ${
                          metric.bestIdx === idx ? "text-accent font-medium" : "text-text-secondary"
                        }`}
                      >
                        {metric.extractor(slot)}
                        {metric.bestIdx === idx && filledSlots.length > 1 && (
                          <span className="ml-1.5 text-[10px] text-accent opacity-70">★</span>
                        )}
                      </td>
                    ) : null
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filledSlots.length < 2 && filledSlots.length > 0 && (
        <div className="card-primary p-8 rounded-xl text-center">
          <p className="text-text-muted text-sm">Select at least one more domain to compare</p>
        </div>
      )}

      {filledSlots.length === 0 && (
        <div className="card-primary p-8 rounded-xl text-center">
          <p className="text-text-muted text-sm">Search and select domains above to begin comparing</p>
        </div>
      )}
    </div>
  );
}
