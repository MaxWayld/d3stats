"use client";

import { formatLargeNumber, type ChainStats, type DomainStats } from "@/lib/doma-api";
import { useInView } from "@/hooks/useInView";
import { useCountUp } from "@/hooks/useCountUp";

interface Props {
  stats: ChainStats | null;
  domainStats: DomainStats | null;
  domainTokenCount: number;
  hasMoreTokens?: boolean;
}

function AnimatedNumber({ value, suffix = "", active }: { value: number; suffix?: string; active: boolean }) {
  const animated = useCountUp(value, 1200, active);
  return <>{formatLargeNumber(animated)}{suffix}</>;
}

export default function KPICards({ stats, domainStats, domainTokenCount, hasMoreTokens }: Props) {
  const { ref, visible, row: t } = useInView();

  const heroNum = stats ? parseFloat(stats.total_transactions) : 0;
  const heroAnimated = useCountUp(heroNum, 1500, visible);

  // Parse numeric values for count-up
  const txToday = stats ? Number(stats.transactions_today) : 0;
  const totalAddr = stats ? Number(stats.total_addresses) : 0;
  const regDomains = domainStats ? domainStats.registeredDomains : 0;
  const subDomains = domainStats ? domainStats.syntheticSubdomains : 0;

  const statsRow = [
    { label: "Transactions Today", num: txToday, suffix: "", ready: !!stats },
    { label: "Total Addresses", num: totalAddr, suffix: "", ready: !!stats },
    { label: "Registered Domains", num: regDomains, suffix: "", ready: !!domainStats },
    { label: "Subdomains Minted", num: subDomains, suffix: "", ready: !!domainStats },
    { label: "Tokenized Domains", num: domainTokenCount, suffix: hasMoreTokens ? "+" : "", ready: !!stats },
    { label: "Avg Block Time", num: 0, fixedValue: stats ? `${(stats.average_block_time / 1000).toFixed(1)}s` : null, suffix: "", ready: !!stats },
  ];

  return (
    <div ref={ref}>
      {/* Hero metric */}
      <div>
        <p className="text-[13px] text-text-secondary font-normal tracking-wide uppercase mb-2" style={t(0)}>
          Total Transactions
        </p>
        <div style={t(80)}>
          {stats ? (
            <p className="text-display text-text-primary num" style={{ textShadow: "0 0 60px rgba(41,182,246,0.06)" }}>
              {formatLargeNumber(heroAnimated)}
            </p>
          ) : (
            <div className="h-16 w-64 skeleton" />
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-x-12 gap-y-4 mt-8">
        {statsRow.map((metric, i) => {
          const delay = 250 + i * 60;
          return (
            <div key={metric.label} style={t(delay)}>
              <p className="text-[11px] text-text-muted uppercase tracking-wider">
                {metric.label}
              </p>
              {metric.ready ? (
                <p className="text-[22px] font-light text-text-primary tracking-tight num">
                  {metric.fixedValue
                    ? metric.fixedValue
                    : <AnimatedNumber value={metric.num} suffix={metric.suffix} active={visible} />
                  }
                </p>
              ) : (
                <div className="h-8 w-28 skeleton" />
              )}
            </div>
          );
        })}
      </div>

      {/* Separator */}
      <div className="h-px bg-border mt-8" style={t(650)} />
    </div>
  );
}
