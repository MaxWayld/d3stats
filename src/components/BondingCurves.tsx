// Component: TopDomainsPreview - displays top domain tokens by holder count
"use client";

import Link from "next/link";
import { type TokenItem } from "@/lib/doma-api";
import { useInView } from "@/hooks/useInView";

interface Props {
  tokens: TokenItem[];
}

export default function BondingCurves({ tokens }: Props) {
  const { ref, row } = useInView();

  // Sort by holders descending, take top 6
  const sorted = [...tokens]
    .sort((a, b) => (parseInt(b.holders_count || "0") - parseInt(a.holders_count || "0")))
    .slice(0, 6);

  const featured = sorted[0];
  const remaining = sorted.slice(1);
  const maxHolders = featured ? parseInt(featured.holders_count || "0") : 1;

  return (
    <div ref={ref} className="card-primary p-5 h-full flex flex-col">
      {/* Header */}
      <span className="text-[13px] font-medium text-text-secondary uppercase tracking-wider mb-4">
        Top Domains
      </span>

      {/* Empty state */}
      {tokens.length === 0 && (
        <p className="text-text-muted text-sm py-8 text-center">No domain tokens found</p>
      )}

      {/* Featured item with bar chart SVG */}
      {featured && (
        <div style={row(0)} className="mb-4">
          <Link
            href={`/token/${featured.address_hash}`}
            className="text-[15px] font-medium text-text-primary hover:text-accent transition-colors"
          >
            {featured.symbol || featured.name || "Unknown"}
          </Link>

          {/* SVG horizontal bar chart of top 5 by holders */}
          <svg
            viewBox="0 0 200 80"
            className="w-full mt-3"
            style={{ height: 80 }}
            preserveAspectRatio="xMinYMid meet"
          >
            <defs>
              <linearGradient id="barFill" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.7" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.2" />
              </linearGradient>
              <filter id="barGlow">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {sorted.slice(0, 5).map((token, i) => {
              const holders = parseInt(token.holders_count || "0");
              const barWidth = maxHolders > 0 ? (holders / maxHolders) * 180 : 0;
              const y = i * 16;
              return (
                <g key={token.address_hash}>
                  <rect
                    x="0"
                    y={y}
                    width={barWidth}
                    height="12"
                    rx="2"
                    fill="url(#barFill)"
                    filter={i === 0 ? "url(#barGlow)" : undefined}
                    opacity={1 - i * 0.15}
                  />
                  <text
                    x={barWidth + 4}
                    y={y + 9}
                    fill="var(--color-text-muted)"
                    fontSize="7"
                  >
                    {token.symbol || "?"}
                  </text>
                </g>
              );
            })}
          </svg>

          <span className="text-[12px] text-text-secondary mt-2 block">
            {featured.holders_count || "0"} holders
          </span>
        </div>
      )}

      {/* Remaining tokens list */}
      <div className="flex-1 min-h-0">
        {remaining.map((token, i) => (
          <div
            key={token.address_hash}
            style={row(80 + i * 40)}
            className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
          >
            <Link
              href={`/token/${token.address_hash}`}
              className="text-[13px] text-text-primary hover:text-accent transition-colors"
            >
              {token.symbol || token.name || "Unknown"}
            </Link>
            <div className="flex flex-col items-end">
              <span className="text-[12px] num text-text-secondary">
                {token.holders_count || "0"} holders
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
