"use client";

import { useState, useMemo, useEffect } from "react";
import {
  shortenAddress,
  weiToEth,
  timeAgo,
  tokenAmount,
  formatMethod,
  type TxItem,
} from "@/lib/doma-api";
import { useInView } from "@/hooks/useInView";

interface Props {
  txs: TxItem[];
}

type FilterTab = "All" | "Transfers" | "Contracts";

export default function RecentTrades({ txs }: Props) {
  const { ref, row } = useInView();
  const [filter, setFilter] = useState<FilterTab>("All");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const filtered = useMemo(() => {
    const base = txs.slice(0, 25);
    if (filter === "All") return base;
    if (filter === "Transfers") {
      return base.filter(
        (tx) =>
          !tx.method ||
          tx.method === "Transfer" ||
          (tx.token_transfers && tx.token_transfers.length > 0)
      );
    }
    // Contracts: to address has a name (is a known contract)
    return base.filter((tx) => tx.to && tx.to.name !== null);
  }, [txs, filter]);

  const tabs: FilterTab[] = ["All", "Transfers", "Contracts"];

  return (
    <div ref={ref} className="card-primary p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3" style={row(0)}>
        <span className="text-[13px] font-medium text-text-secondary uppercase tracking-wider">
          Recent Activity
        </span>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors ${
                filter === tab
                  ? "text-text-primary bg-bg-surface"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[380px] scroll-fade pr-2">
        {filtered.length === 0 && (
          <p className="text-text-muted text-sm py-8 text-center">No transactions</p>
        )}
        {filtered.map((tx, i) => {
          const fromLabel = tx.from.name || shortenAddress(tx.from.hash);
          const toLabel = tx.to ? (tx.to.name || shortenAddress(tx.to.hash)) : "Contract";
          const method = formatMethod(tx.method, tx.decoded_input);

          const isTokenTransfer = tx.token_transfers && tx.token_transfers.length > 0;
          const borderColor = isTokenTransfer ? "var(--color-green)"
            : (method !== "transfer" ? "var(--color-purple)" : "transparent");

          // Show token transfer info if available
          let valueStr = "";
          let isLargeValue = false;
          if (tx.token_transfers && tx.token_transfers.length > 0) {
            const tt = tx.token_transfers[0];
            const decimals = tt.total.decimals;
            const rawVal = tt.total.value;
            const amount = decimals
              ? tokenAmount(rawVal, decimals)
              : parseFloat(rawVal);
            const symbol = tt.token.symbol || "???";
            valueStr = `${amount > 1000 ? amount.toFixed(0) : amount.toFixed(4)} ${symbol}`;
            isLargeValue = amount > 1000;
          } else {
            const ethValue = weiToEth(tx.value);
            valueStr = ethValue > 0 ? `${ethValue.toFixed(4)} ETH` : "";
            isLargeValue = ethValue > 1;
          }

          return (
            <div
              key={tx.hash}
              style={{
                ...row(i * 40),
                borderLeftColor: borderColor,
                borderLeftWidth: 2,
                borderLeftStyle: "solid",
              }}
              className="py-2.5 pl-3 border-b border-border/30 last:border-0 flex items-center gap-4"
            >
              <span className="text-[13px] font-medium text-text-primary w-[110px] truncate">
                {fromLabel}
              </span>
              <span className="text-[11px] text-text-muted">
                &rarr;
              </span>
              <span className="text-[13px] text-text-secondary w-[110px] truncate">
                {toLabel}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-text-muted">
                {method}
              </span>
              <span className={`text-[13px] num flex-1 truncate ${
                isLargeValue ? "text-text-primary font-medium" : "text-text-secondary"
              }`}>
                {valueStr}
              </span>
              <a
                href={`https://explorer.doma.xyz/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-text-muted ml-auto hover:text-accent transition-colors shrink-0"
              >
                {hydrated ? timeAgo(tx.timestamp) : ""}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
