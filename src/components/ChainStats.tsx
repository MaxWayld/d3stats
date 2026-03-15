"use client";

import { useEffect, useState } from "react";
import { formatLargeNumber, type ChainStats as ChainStatsType } from "@/lib/doma-api";
import { useInView } from "@/hooks/useInView";

interface Props {
  stats: ChainStatsType | null;
  domainTokenCount: number;
  hasMoreTokens?: boolean;
  tldDistribution: { name: string; count: number; pct: number }[];
}

function StatusDot({ value }: { value: number }) {
  const color = value > 80 ? "bg-red" : value > 50 ? "bg-amber" : "bg-green";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color} shrink-0`} />;
}

export default function ChainStats({ stats, domainTokenCount, hasMoreTokens, tldDistribution }: Props) {
  const { ref, visible, row } = useInView();
  const [mounted, setMounted] = useState(false);

  // Trigger bar width animation after visible
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setMounted(true), 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!stats) {
    return (
    <div ref={ref} className="card-primary p-5 h-full flex flex-col">
        <span style={row(0)} className="text-[13px] font-medium text-text-secondary uppercase tracking-wider mb-4">
          Chain Info
        </span>
        <span className="text-[13px] text-text-muted">Loading...</span>
      </div>
    );
  }

  const utilizationPct = stats.network_utilization_percentage;
  const avgGas = stats.gas_prices.average;

  const items: { label: string; value: string; dot?: number }[] = [
    { label: "Total Blocks", value: formatLargeNumber(stats.total_blocks) },
    { label: "Avg Block Time", value: `${(stats.average_block_time / 1000).toFixed(1)}s` },
    {
      label: "Gas Price",
      value: `${stats.gas_prices.slow} / ${stats.gas_prices.average} / ${stats.gas_prices.fast} gwei`,
      dot: avgGas,
    },
    { label: "Network Utilization", value: `${utilizationPct.toFixed(1)}%`, dot: utilizationPct },
    { label: "Gas Used Today", value: formatLargeNumber(stats.gas_used_today) },
    { label: "Domain Tokens", value: `${domainTokenCount}${hasMoreTokens ? "+" : ""}` },
  ];

  return (
    <div ref={ref} className="card-primary p-5 h-full flex flex-col">
      <span style={row(0)} className="text-[13px] font-medium text-text-secondary uppercase tracking-wider mb-4">
        Chain Info
      </span>

      {/* Top half: chain stats */}
      {items.map((item, i) => (
        <div
          key={item.label}
          style={row(40 + i * 40)}
          className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
        >
          <span className="text-[13px] text-text-secondary flex items-center gap-1.5">
            {item.dot !== undefined && <StatusDot value={item.dot} />}
            {item.label}
          </span>
          <span className="text-[13px] num text-text-primary">{item.value}</span>
        </div>
      ))}

      {/* Separator */}
      <div className="h-px bg-border my-4" style={row(300)} />

      {/* Bottom half: TLD Distribution */}
      <span
        style={row(320)}
        className="text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-3"
      >
        TLD Distribution
      </span>

      <div className="flex-1 min-h-0">
        {tldDistribution.map((tld, i) => (
          <div
            key={tld.name}
            style={row(360 + i * 35)}
            className="flex items-center gap-3 py-1.5"
          >
            <span className="text-[13px] text-text-secondary w-12 shrink-0">
              {tld.name}
            </span>
            <span className="text-[12px] num text-text-muted w-6 text-right shrink-0">
              {tld.count}
            </span>
            <div className="flex-1 h-1 rounded-full bg-bg-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
                style={{ width: mounted ? `${tld.pct}%` : "0%", transition: "width 0.8s ease" }}
              />
            </div>
            <span className="text-[12px] num text-text-muted shrink-0">
              {tld.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
