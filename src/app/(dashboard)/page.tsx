// No metadata export needed - uses default from root layout

import KPICards from "@/components/KPICards";
import TopDomains from "@/components/TopDomains";
import VolumeChart from "@/components/VolumeChart";
import BondingCurves from "@/components/BondingCurves";
import RecentTrades from "@/components/RecentTrades";
import WhaleTracker from "@/components/WhaleTracker";
import ChainStats from "@/components/ChainStats";
import NetworkPulse from "@/components/NetworkPulse";
import FadeIn from "@/components/FadeIn";
import {
  fetchChainStats,
  fetchDomainStats,
  fetchAllTokensPaginated,
  fetchTransactionChart,
  fetchRecentTransactions,
  fetchTopAddresses,
  fetchRecentBlocks,
  isDomainToken,
  computeTLDDistribution,
} from "@/lib/doma-api";

export const revalidate = 30;

async function loadData() {
  const [stats, domainStats, tokenData, chart, txs, addresses, blocks] =
    await Promise.allSettled([
      fetchChainStats(),
      fetchDomainStats(),
      fetchAllTokensPaginated(1),
      fetchTransactionChart(),
      fetchRecentTransactions(),
      fetchTopAddresses(),
      fetchRecentBlocks(),
    ]);

  const allTokens = tokenData.status === "fulfilled" ? tokenData.value.tokens : [];
  const domainTokens = allTokens.filter(isDomainToken);
  const hasMoreTokens = tokenData.status === "fulfilled" ? tokenData.value.hasMore : false;
  const dStats = domainStats.status === "fulfilled" ? domainStats.value : null;

  return {
    stats: stats.status === "fulfilled" ? stats.value : null,
    domainStats: dStats,
    domainTokens,
    hasMoreTokens,
    chart: chart.status === "fulfilled" ? chart.value : [],
    txs: txs.status === "fulfilled" ? txs.value : [],
    addresses: addresses.status === "fulfilled" ? addresses.value : [],
    blocks: blocks.status === "fulfilled" ? blocks.value : [],
    tldDistribution: computeTLDDistribution(domainTokens),
  };
}

export default async function DashboardPage() {
  const data = await loadData();

  return (
    <>
      {/* KPI Hero */}
      <FadeIn as="section" className="pt-8 pb-10" delay={0} duration={700}>
        <KPICards stats={data.stats} domainStats={data.domainStats} domainTokenCount={data.domainTokens.length} hasMoreTokens={data.hasMoreTokens} />
      </FadeIn>

      {/* Chart 2/4 + Network 1/4 + Top Domains 1/4 */}
      <section className="grid grid-cols-1 xl:grid-cols-4 gap-6 pb-8 items-stretch">
        <FadeIn className="xl:col-span-2 flex" delay={80}>
          <div className="flex-1 flex flex-col">
            <VolumeChart chart={data.chart} />
          </div>
        </FadeIn>
        <FadeIn className="flex" delay={160}>
          <div className="flex-1">
            <NetworkPulse stats={data.stats} blocks={data.blocks} />
          </div>
        </FadeIn>
        <FadeIn className="flex" delay={240}>
          <div className="flex-1">
            <BondingCurves tokens={data.domainTokens} />
          </div>
        </FadeIn>
      </section>

      {/* Secondary panels — ABOVE domains */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8 items-stretch">
        <FadeIn delay={0}>
          <RecentTrades txs={data.txs} />
        </FadeIn>
        <FadeIn delay={80}>
          <WhaleTracker addresses={data.addresses} />
        </FadeIn>
        <FadeIn delay={160}>
          <ChainStats stats={data.stats} domainTokenCount={data.domainTokens.length} hasMoreTokens={data.hasMoreTokens} tldDistribution={data.tldDistribution} />
        </FadeIn>
      </section>

      {/* Domains table — full width, no FadeIn delay (appears immediately when scrolled) */}
      <section className="pb-8">
        <TopDomains tokens={data.domainTokens} immediate />
      </section>

    </>
  );
}
