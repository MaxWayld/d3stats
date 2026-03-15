import FadeIn from "@/components/FadeIn";
import HolderDonut from "@/components/HolderDonut";
import CopyAddress from "@/components/CopyAddress";
import Link from "next/link";
import {
  fetchTokenDetail,
  fetchTokenCounters,
  fetchTokenHolders,
  fetchTokenTransfersByToken,
  formatLargeNumber,
  shortenAddress,
  tokenAmount,
  type TokenItem,
  type TokenCounters,
  type TokenHolder,
  type TokenTransfer,
} from "@/lib/doma-api";

export const revalidate = 30;

const COLORS = ["#29b6f6", "#4ade80", "#a78bfa", "#fbbf24", "#f87171", "#27272a"];

interface Props {
  params: Promise<{ address: string }>;
}

async function loadTokenData(address: string) {
  const [token, counters, holders, transfers] = await Promise.allSettled([
    fetchTokenDetail(address),
    fetchTokenCounters(address),
    fetchTokenHolders(address),
    fetchTokenTransfersByToken(address),
  ]);

  return {
    token: token.status === "fulfilled" ? token.value : null,
    counters: counters.status === "fulfilled" ? counters.value : null,
    holders: holders.status === "fulfilled" ? holders.value : [],
    transfers: transfers.status === "fulfilled" ? transfers.value : [],
  };
}

export default async function TokenPage({ params }: Props) {
  const { address } = await params;
  const { token, counters, holders, transfers } = await loadTokenData(address);

  if (!token) {
    return (
      <div className="pt-8">
        <Link href="/" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          &larr; Dashboard
        </Link>
        <div className="mt-16 text-center">
          <p className="text-[32px] font-light text-text-muted">Token not found</p>
          <p className="text-text-secondary text-sm mt-2">
            The token at address <span className="num text-text-muted">{shortenAddress(address)}</span> could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const topHolders = holders.slice(0, 20);
  const recentTransfers = transfers.slice(0, 10);
  const totalSupplyRaw = token.total_supply ?? "0";
  const totalSupplyNum = tokenAmount(totalSupplyRaw, token.decimals);
  const totalSupply = parseFloat(totalSupplyRaw);

  // Compute donut chart data from top 5 holders
  const donutData = holders.slice(0, 5).map((h: TokenHolder, i: number) => ({
    name: h.address.name || shortenAddress(h.address.hash),
    value: totalSupply > 0 ? (parseFloat(h.value) / totalSupply) * 100 : 0,
    color: COLORS[i],
  }));
  const othersShare = 100 - donutData.reduce((s: number, d: { value: number }) => s + d.value, 0);
  if (othersShare > 0) donutData.push({ name: "Others", value: othersShare, color: "#27272a" });

  return (
    <>
      {/* Back link */}
      <div className="pt-8">
        <Link href="/" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          &larr; Dashboard
        </Link>
      </div>

      {/* Token header */}
      <div className="mt-6">
        <h1 className="text-[32px] font-light text-text-primary tracking-tight">
          {token.name ?? "Unknown Token"}
          {token.symbol && (
            <span className="text-text-muted ml-2">({token.symbol})</span>
          )}
        </h1>

        <div className="flex items-center gap-3 mt-2 group">
          <CopyAddress address={address} display={address} className="text-sm text-text-muted num" />
        </div>

        <a
          href={`https://explorer.doma.xyz/token/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent text-sm hover:underline mt-1 inline-block"
        >
          View on Explorer &rarr;
        </a>
      </div>

      {/* Donut chart + Counters — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="card-primary p-5">
          <h3 className="text-micro text-text-muted mb-3">Holder Distribution</h3>
          <HolderDonut holders={donutData} />
        </div>

        {counters && (
          <div className="card-primary p-5 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[22px] font-light num text-text-primary">
                  {formatLargeNumber(counters.token_holders_count)}
                </p>
                <p className="text-[11px] text-text-muted uppercase tracking-wider">Holders</p>
              </div>
              <div>
                <p className="text-[22px] font-light num text-text-primary">
                  {formatLargeNumber(counters.transfers_count)}
                </p>
                <p className="text-[11px] text-text-muted uppercase tracking-wider">Transfers</p>
              </div>
              <div>
                <p className="text-[22px] font-light num text-text-primary">
                  {formatLargeNumber(totalSupplyNum)}
                </p>
                <p className="text-[11px] text-text-muted uppercase tracking-wider">Supply</p>
              </div>
              <div>
                <p className="text-[22px] font-light num text-text-primary">
                  {token.decimals ?? "\u2014"}
                </p>
                <p className="text-[11px] text-text-muted uppercase tracking-wider">Decimals</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="h-px bg-border my-8" />

      {/* Top holders */}
      <FadeIn delay={100}>
        <h2 className="text-[13px] uppercase text-text-muted tracking-wider mb-4">Holders</h2>

        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
        <div className="grid grid-cols-[48px_1fr_1fr_100px] text-[11px] uppercase text-text-muted tracking-wider pb-2 border-b border-border">
          <span>#</span>
          <span>Address</span>
          <span>Balance</span>
          <span>Share</span>
        </div>

        {topHolders.map((holder: TokenHolder, i: number) => {
          const balance = tokenAmount(holder.value, token.decimals);
          const share = totalSupply > 0
            ? ((parseFloat(holder.value) / totalSupply) * 100).toFixed(2)
            : "0.00";

          const hasVesting = holder.address.implementations?.some(
            (impl) => impl.name === "DomaVestingWallet"
          );

          return (
            <div
              key={holder.address.hash}
              className="grid grid-cols-[48px_1fr_1fr_100px] py-3 border-b border-border/30 row-interactive items-center"
            >
              <span className="text-text-muted num text-sm">{i + 1}</span>
              <span className="text-sm">
                <Link href={`/address/${holder.address.hash}`} className="text-text-primary hover:text-accent transition-colors num">
                  {holder.address.name || shortenAddress(holder.address.hash)}
                </Link>
                {holder.address.is_contract && (
                  <span className="text-text-muted text-xs ml-1">(contract)</span>
                )}
                {hasVesting && (
                  <span className="text-accent text-xs ml-1">Vesting</span>
                )}
              </span>
              <span className="text-sm num text-text-primary">
                {formatLargeNumber(balance)}
              </span>
              <span className="text-sm num text-text-secondary">{share}%</span>
            </div>
          );
        })}
          </div>
        </div>

        {topHolders.length === 0 && (
          <p className="text-text-muted text-sm py-4">No holders found.</p>
        )}
      </FadeIn>

      {/* Recent transfers */}
      <FadeIn delay={200} className="mt-8">
        <h2 className="text-[13px] uppercase text-text-muted tracking-wider mb-4">Recent Transfers</h2>

        {recentTransfers.map((transfer: TokenTransfer, i: number) => {
          const amount = tokenAmount(transfer.total.value, transfer.total.decimals);

          return (
            <div
              key={`${transfer.from.hash}-${transfer.to.hash}-${i}`}
              className="flex items-center gap-4 py-2.5 border-b border-border/30"
            >
              <Link href={`/address/${transfer.from.hash}`} className="text-sm num text-text-primary hover:text-accent transition-colors">
                {shortenAddress(transfer.from.hash)}
              </Link>
              <span className="text-text-muted text-sm">&rarr;</span>
              <Link href={`/address/${transfer.to.hash}`} className="text-sm num text-text-primary hover:text-accent transition-colors">
                {shortenAddress(transfer.to.hash)}
              </Link>
              <span className="text-sm num text-text-secondary ml-auto">
                {formatLargeNumber(amount)}
              </span>
              <span className="text-xs text-text-muted uppercase">{transfer.type}</span>
            </div>
          );
        })}

        {recentTransfers.length === 0 && (
          <p className="text-text-muted text-sm py-4">No recent transfers.</p>
        )}
      </FadeIn>
    </>
  );
}
