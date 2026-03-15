"use client";

import { useState, useEffect } from "react";
import { type ChainStats, type BlockItem, timeAgo } from "@/lib/doma-api";
import { useInView } from "@/hooks/useInView";

interface Props {
  stats: ChainStats | null;
  blocks: BlockItem[];
}

export default function NetworkPulse({ stats, blocks }: Props) {
  const { ref, row } = useInView();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const recentBlocks = blocks.slice(0, 4);
  const utilization = stats?.network_utilization_percentage ?? 0;

  return (
    <div ref={ref} className="card-primary p-5 h-full flex flex-col">
      {/* Header */}
      <h3
        className="text-[13px] font-medium text-text-secondary uppercase tracking-wider mb-4"
        style={row(0)}
      >
        Network
      </h3>

      {/* Block time heartbeat */}
      <div className="flex items-center gap-2 mb-4" style={row(60)}>
        <span className="relative flex items-center justify-center w-3 h-3">
          <span className="absolute w-full h-full rounded-full bg-green opacity-40" style={{ animation: "ripple 2s ease-out infinite" }} />
          <span className="w-2 h-2 rounded-full bg-green" />
        </span>
        <span className="text-[13px] text-text-primary">
          {stats ? `${(stats.average_block_time / 1000).toFixed(1)}s blocks` : "-"}
        </span>
      </div>

      {/* Gas gauge */}
      {stats && (
        <div className="mb-4" style={row(120)}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-center">
              <div className="text-[12px] num text-text-primary">{stats.gas_prices.slow}</div>
              <div className="text-[10px] text-text-muted">Slow</div>
            </div>
            <div className="text-center">
              <div className="text-[12px] num text-text-primary">{stats.gas_prices.average}</div>
              <div className="text-[10px] text-text-muted">Avg</div>
            </div>
            <div className="text-center">
              <div className="text-[12px] num text-text-primary">{stats.gas_prices.fast}</div>
              <div className="text-[10px] text-text-muted">Fast</div>
            </div>
          </div>
          <div className="h-1 bg-bg-surface w-full rounded-full">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-text-muted mt-1">{utilization.toFixed(1)}% utilization</div>
        </div>
      )}

      {/* Recent blocks */}
      <div className="flex-1 mt-1" style={row(180)}>
        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Recent Blocks</div>
        {recentBlocks.map((block, i) => (
          <div
            key={block.height}
            className={`flex items-center gap-3 py-2 ${
              i < recentBlocks.length - 1 ? "border-b border-border/30" : ""
            }`}
            style={row(200 + i * 50)}
          >
            <a
              href={`https://explorer.doma.xyz/block/${block.height}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] num text-accent w-[72px] shrink-0 hover:underline"
            >
              #{block.height.toLocaleString("en-US")}
            </a>
            <span className="text-[11px] num text-text-primary w-[48px] shrink-0">
              {block.transactions_count} tx
            </span>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="w-10 h-1 rounded-full bg-bg-surface overflow-hidden shrink-0">
                <div className="h-full rounded-full" style={{
                  width: `${Math.min(block.gas_used_percentage, 100)}%`,
                  background: block.gas_used_percentage > 80 ? "var(--color-red)" : block.gas_used_percentage > 50 ? "var(--color-amber)" : "var(--color-green)"
                }} />
              </div>
              <span className="text-[10px] text-text-muted">{block.gas_used_percentage.toFixed(0)}%</span>
            </div>
            <span className="text-[10px] text-text-muted shrink-0">
              {hydrated ? timeAgo(block.timestamp) : ""}
            </span>
          </div>
        ))}

        {recentBlocks.length === 0 && (
          <div className="text-[12px] text-text-muted py-2">No recent blocks</div>
        )}
      </div>
    </div>
  );
}
