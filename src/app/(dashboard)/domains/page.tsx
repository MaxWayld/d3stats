import type { Metadata } from "next";
import FadeIn from "@/components/FadeIn";
import DomainsTable from "@/components/DomainsTable";
import {
  fetchAllTokensPaginated,
  fetchDomainStats,
  isDomainToken,
  computeTLDDistribution,
  formatLargeNumber,
} from "@/lib/doma-api";

export const metadata: Metadata = { title: "Domains" };

export const revalidate = 30;

async function loadData() {
  try {
    // Fetch many pages for accurate TLD distribution, but table shows first page only
    const [allTokenData, firstPageData, domainStatsRes] = await Promise.allSettled([
      fetchAllTokensPaginated(8), // 8 pages for TLD stats (~400 tokens)
      fetchAllTokensPaginated(1), // 1 page for initial table (50 tokens)
      fetchDomainStats(),
    ]);

    const allTokens = allTokenData.status === "fulfilled" ? allTokenData.value.tokens : [];
    const allDomainTokens = allTokens.filter(isDomainToken);
    const tldDistribution = computeTLDDistribution(allDomainTokens);

    const firstPage = firstPageData.status === "fulfilled" ? firstPageData.value : { tokens: [], hasMore: false, nextPageParams: null };
    const tableTokens = firstPage.tokens.filter(isDomainToken);

    const domainStats = domainStatsRes.status === "fulfilled" ? domainStatsRes.value : null;

    return {
      tableTokens,
      totalDomainTokens: allDomainTokens.length,
      tldDistribution,
      hasMore: firstPage.hasMore,
      nextPageParams: firstPage.nextPageParams,
      domainStats,
    };
  } catch {
    return { tableTokens: [], totalDomainTokens: 0, tldDistribution: [], hasMore: false, nextPageParams: null, domainStats: null };
  }
}

export default async function DomainsPage() {
  const { tableTokens, totalDomainTokens, tldDistribution, hasMore, nextPageParams, domainStats } = await loadData();

  return (
    <>
      <FadeIn as="section" className="pt-8 pb-6" delay={0} duration={700}>
        <h1 className="text-[32px] font-light text-text-primary mb-2">
          Domain Tokens
        </h1>
        <p className="text-[14px] text-text-muted mb-8">
          Tokenized DNS domains on Doma chain, sorted by holder count
        </p>

        {/* Overview stats */}
        <div className="flex flex-wrap gap-6 mb-8">
          {domainStats && (
            <>
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wider">Registered Domains</p>
                <p className="text-[20px] font-light text-text-primary num">{formatLargeNumber(domainStats.registeredDomains)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wider">Subdomains Minted</p>
                <p className="text-[20px] font-light text-text-primary num">{formatLargeNumber(domainStats.syntheticSubdomains)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wider">Domain Transfers</p>
                <p className="text-[20px] font-light text-text-primary num">{formatLargeNumber(domainStats.domainTransfers)}</p>
              </div>
            </>
          )}
          <div>
            <p className="text-[11px] text-text-muted uppercase tracking-wider">Tokenized</p>
            <p className="text-[20px] font-light text-text-primary num">{totalDomainTokens}</p>
          </div>
        </div>

        {/* TLD Distribution */}
        <div className="flex flex-wrap gap-3 mb-8">
          {tldDistribution.map((tld) => (
            <div
              key={tld.name}
              className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-4 py-2.5"
            >
              <span className="text-[14px] font-medium text-text-primary">{tld.name}</span>
              <span className="text-[13px] num text-text-secondary">{tld.count}</span>
              <span className="text-[11px] text-text-muted">({tld.pct}%)</span>
            </div>
          ))}
        </div>
      </FadeIn>

      <FadeIn as="section" className="pb-12" delay={80}>
        <DomainsTable
          initialTokens={tableTokens}
          hasMore={hasMore}
          nextPageParams={nextPageParams}
        />
      </FadeIn>
    </>
  );
}
