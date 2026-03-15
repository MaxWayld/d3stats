import type { Metadata } from "next";
import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import { shortenAddress, weiToEth, formatLargeNumber, fetchAllAddresses, type AddressItem } from "@/lib/doma-api";

export const metadata: Metadata = { title: "Top Accounts" };

export const revalidate = 30;

export default async function WhalesPage() {
  let addresses: AddressItem[] = [];
  try {
    addresses = await fetchAllAddresses();
  } catch {
    addresses = [];
  }

  return (
    <>
      <FadeIn as="section" delay={0} duration={700}>
        <div className="flex items-center gap-3">
          <h1 className="text-[32px] font-light text-text-primary tracking-tight">
            Top Accounts
          </h1>
          <span className="text-[12px] text-text-muted bg-bg-surface px-2.5 py-1 rounded-full">
            {addresses.length} addresses
          </span>
        </div>
      </FadeIn>

      <FadeIn as="section" delay={80}>
        <div className="bg-bg-card rounded-lg border border-border overflow-hidden overflow-x-auto mt-8 card-glow">
          <div className="min-w-[500px]">
          {/* Table header */}
          <div className="grid items-center py-3 px-5 border-b border-border bg-bg-surface text-[11px] text-text-muted uppercase tracking-wider" style={{ gridTemplateColumns: "48px 1.5fr 0.6fr 1fr 1fr" }}>
            <span>#</span>
            <span>Account</span>
            <span>Type</span>
            <span>Balance</span>
            <span>Transactions</span>
          </div>

          {/* Empty state */}
          {addresses.length === 0 && (
            <div className="py-12 text-center text-text-muted text-sm">No accounts found</div>
          )}

          {/* Rows */}
          {addresses.map((addr: AddressItem, i: number) => {
            const ethBalance = weiToEth(addr.coin_balance);
            const displayName =
              addr.ens_domain_name ||
              addr.name ||
              shortenAddress(addr.hash);

            return (
              <div
                key={addr.hash}
                className="grid items-center py-3 px-5 border-b border-border/30 last:border-0 hover:bg-bg-card-hover transition-colors"
                style={{ gridTemplateColumns: "48px 1.5fr 0.6fr 1fr 1fr" }}
              >
                <span className="text-[13px] num text-text-muted">
                  {i + 1}
                </span>
                <span className="text-[14px] font-medium truncate">
                  <Link
                    href={`/address/${addr.hash}`}
                    className={`hover:text-accent transition-colors ${
                      addr.ens_domain_name
                        ? "text-accent"
                        : "text-text-primary"
                    }`}
                  >
                    {displayName}
                  </Link>
                </span>
                <span>
                  {addr.is_contract ? (
                    <span className="text-text-muted text-[10px] uppercase">Contract</span>
                  ) : (
                    <span className="text-accent text-[10px] uppercase">Wallet</span>
                  )}
                </span>
                <span className="text-[13px] num text-text-primary">
                  {ethBalance.toFixed(2)} ETH
                </span>
                <span className="text-[13px] num text-text-secondary">
                  {formatLargeNumber(addr.transactions_count)} txns
                </span>
              </div>
            );
          })}
          </div>
        </div>
      </FadeIn>
    </>
  );
}
