"use client";

import { useMemo, useState } from "react";
import { formatDate, type ChartDataPoint } from "@/lib/doma-api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useInView } from "@/hooks/useInView";

interface Props {
  chart: ChartDataPoint[];
}

const ACCENT = "#29b6f6";

type TimeRange = "7D" | "14D" | "30D";

const RANGE_DAYS: Record<TimeRange, number> = { "7D": 7, "14D": 14, "30D": 30 };

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

function formatStatValue(value: number): string {
  return value.toLocaleString("en-US");
}

interface TooltipPayloadEntry {
  value: number;
  dataKey: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border rounded-md p-2 shadow-lg">
      <p className="text-[11px] text-text-muted mb-0.5">{label}</p>
      <p className="text-[12px] font-medium text-text-primary num">
        {payload[0].value.toLocaleString("en-US")}
      </p>
    </div>
  );
}

export default function VolumeChart({ chart }: Props) {
  const { ref, row: fade } = useInView();
  const [range, setRange] = useState<TimeRange>("30D");

  const data = useMemo(() => {
    const reversed = [...chart].reverse();
    const days = RANGE_DAYS[range];
    return reversed.slice(-days);
  }, [chart, range]);

  const stats = useMemo(() => {
    if (data.length === 0) return { high: 0, low: 0, avg: 0 };
    const values = data.map((d) => d.transactions_count);
    const high = Math.max(...values);
    const low = Math.min(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { high, low, avg };
  }, [data]);

  const ranges: TimeRange[] = ["7D", "14D", "30D"];

  return (
    <div ref={ref} className="card-primary p-5 h-full flex flex-col" style={fade(0)}>
      {/* Header inside card */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-medium text-text-secondary uppercase tracking-wider">
          Daily Transactions
        </span>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors ${
                range === r
                  ? "bg-accent text-white"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradAccent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.20} />
                <stop offset="60%" stopColor={ACCENT} stopOpacity={0.06} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
              <filter id="lineGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <XAxis
              dataKey="date"
              tickFormatter={(val: string) => formatDate(val)}
              tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />

            <YAxis
              tickFormatter={formatAxisValue}
              tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              dx={-4}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: ACCENT, strokeWidth: 1, strokeOpacity: 0.2 }}
            />

            <Area
              type="monotone"
              dataKey="transactions_count"
              stroke={ACCENT}
              strokeWidth={2}
              fill="url(#gradAccent)"
              filter="url(#lineGlow)"
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mt-4 pt-3 border-t border-border/30">
        <div className="card-inset px-3 py-2 flex-1">
          <div className="text-[10px] text-text-muted uppercase tracking-wider">High</div>
          <div className="text-caption num text-green mt-0.5">{formatStatValue(stats.high)}</div>
        </div>
        <div className="card-inset px-3 py-2 flex-1">
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Low</div>
          <div className="text-caption num text-red mt-0.5">{formatStatValue(stats.low)}</div>
        </div>
        <div className="card-inset px-3 py-2 flex-1">
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Avg</div>
          <div className="text-caption num text-text-secondary mt-0.5">{formatStatValue(Math.round(stats.avg))}</div>
        </div>
      </div>
    </div>
  );
}
