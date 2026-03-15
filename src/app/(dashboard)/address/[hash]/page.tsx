import FadeIn from "@/components/FadeIn";
import CopyAddress from "@/components/CopyAddress";
import Link from "next/link";
import {
  fetchAddressDetail,
  fetchAddressTokens,
  formatLargeNumber,
  shortenAddress,
  weiToEth,
  tokenAmount,
  type AddressItem,
  type AddressTokenHolding,
} from "@/lib/doma-api";

export const revalidate = 30;

interface Props {
  params: Promise<{ hash: string }>;
}

async function loadAddressData(hash: string) {
  const [address, tokens] = await Promise.allSettled([
    fetchAddressDetail(hash),
    fetchAddressTokens(hash),
  ]);

  return {
    address: address.status === "fulfilled" ? address.value : null,
    tokens: tokens.status === "fulfilled" ? tokens.value : [],
  };
}

export default async function AddressPage({ params }: Props) {
  const { hash } = await params;
  const { address, tokens } = await loadAddressData(hash);

  if (!address) {
    return (
      <div className="pt-8">
        <Link href="/" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          &larr; Dashboard
        </Link>
        <div className="mt-16 text-center">
          <p className="text-[32px] font-light text-text-muted">Address not found</p>
          <p className="text-text-secondary text-sm mt-2">
            The address <span className="num text-text-muted">{shortenAddress(hash)}</span> could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const balanceEth = weiToEth(address.coin_balance ?? "0");

  return (
    <>
      {/* Back link */}
      <div className="pt-8">
        <Link href="/" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          &larr; Dashboard
        </Link>
      </div>

      {/* Address header */}
      <div className="mt-6">
        {address.name && (
          <p className="text-text-secondary text-sm mb-1">{address.name}</p>
        )}
        <h1 className="text-[18px] text-text-primary font-medium num break-all group">
          <CopyAddress address={hash} display={hash} className="text-text-primary" />
        </h1>

        <a
          href={`https://explorer.doma.xyz/address/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent text-sm hover:underline mt-2 inline-block"
        >
          View on Explorer &rarr;
        </a>
      </div>

      {/* Stats row */}
      <div className="flex gap-8 mt-6">
        <div>
          <p className="text-[22px] font-light num text-text-primary">
            {balanceEth.toFixed(4)}
          </p>
          <p className="text-[11px] text-text-muted uppercase tracking-wider">Balance (ETH)</p>
        </div>
        <div>
          <p className="text-[22px] font-light num text-text-primary">
            {formatLargeNumber(address.transactions_count)}
          </p>
          <p className="text-[11px] text-text-muted uppercase tracking-wider">Transactions</p>
        </div>
        <div>
          <p className="text-[22px] font-light num text-text-primary">
            {address.is_contract ? "Yes" : "No"}
          </p>
          <p className="text-[11px] text-text-muted uppercase tracking-wider">Contract</p>
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-border my-8" />

      {/* Token holdings */}
      <FadeIn delay={100}>
        <h2 className="text-[13px] uppercase text-text-muted tracking-wider mb-4">Token Holdings</h2>

        {tokens.length > 0 ? (
          <div>
            <div className="grid grid-cols-[1fr_1fr_100px] text-[11px] uppercase text-text-muted tracking-wider pb-2 border-b border-border">
              <span>Token</span>
              <span>Balance</span>
              <span>Symbol</span>
            </div>

            {tokens.map((holding: AddressTokenHolding) => {
              const balance = tokenAmount(holding.value ?? "0", holding.token.decimals);

              return (
                <div
                  key={holding.token.address_hash}
                  className="grid grid-cols-[1fr_1fr_100px] py-3 border-b border-border/30 row-interactive items-center"
                >
                  <Link
                    href={`/token/${holding.token.address_hash}`}
                    className="text-sm text-text-primary hover:text-accent transition-colors"
                  >
                    {holding.token.name ?? "Unknown"}
                  </Link>
                  <span className="text-sm num text-text-primary">
                    {formatLargeNumber(balance)}
                  </span>
                  <span className="text-sm text-text-muted">
                    {holding.token.symbol ?? "\u2014"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-text-muted text-sm py-4">No token holdings found.</p>
        )}
      </FadeIn>
    </>
  );
}
