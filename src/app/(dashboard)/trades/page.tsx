import type { Metadata } from "next";
import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import {
  fetchRecentTransactions,
  shortenAddress,
  weiToEth,
  formatDate,
  tokenAmount,
  formatMethod,
  type TxItem,
} from "@/lib/doma-api";

export const metadata: Metadata = { title: "Trades" };

export const revalidate = 30;

export default async function TradesPage() {
  let txs: TxItem[] = [];
  try {
    txs = await fetchRecentTransactions();
  } catch {
    txs = [];
  }

  return (
    <>
      <FadeIn as="section" delay={0} duration={700}>
        <h1 className="text-[32px] font-light text-text-primary tracking-tight">
          Recent Activity
        </h1>
        <p className="text-sm text-text-muted mt-2">
          Latest transactions on Doma chain
        </p>
      </FadeIn>

      <FadeIn as="section" delay={80}>
        <div className="bg-bg-card rounded-lg border border-border overflow-hidden overflow-x-auto mt-8">
          <div className="min-w-[600px]">
          {/* Table header */}
          <div className="grid items-center py-3 px-5 border-b border-border bg-bg-surface text-[11px] text-text-muted uppercase tracking-wider" style={{ gridTemplateColumns: "1fr 48px 1fr 120px 1fr 80px 80px" }}>
            <span>From</span>
            <span className="text-center">&rarr;</span>
            <span>To</span>
            <span>Method</span>
            <span>Value</span>
            <span>Block</span>
            <span>Time</span>
          </div>

          {/* Rows */}
          {txs.length > 0 ? (
            txs.map((tx: TxItem) => {
              const transfer = tx.token_transfers?.[0];
              let valueDisplay: string;
              if (transfer && transfer.total) {
                const amt = tokenAmount(transfer.total.value, transfer.total.decimals);
                valueDisplay = `${amt.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${transfer.token.symbol || ""}`;
              } else {
                const eth = weiToEth(tx.value);
                valueDisplay = eth > 0 ? `${eth.toFixed(4)} ETH` : "0 ETH";
              }

              const method = formatMethod(tx.method, tx.decoded_input);

              return (
                <div
                  key={tx.hash}
                  className="grid items-center py-3 px-5 border-b border-border/30 last:border-0 hover:bg-bg-card-hover transition-colors"
                  style={{ gridTemplateColumns: "1fr 48px 1fr 120px 1fr 80px 80px" }}
                >
                  <span className="text-[13px] text-text-primary truncate">
                    {shortenAddress(tx.from.hash)}
                  </span>
                  <span className="text-[11px] text-text-muted text-center">&rarr;</span>
                  <span className="text-[13px] text-text-secondary truncate">
                    {tx.to ? (tx.to.name || shortenAddress(tx.to.hash)) : "Contract Create"}
                  </span>
                  <span className="text-[11px] text-text-muted uppercase tracking-wider">
                    {method}
                  </span>
                  <span className="text-[13px] num text-text-primary truncate">
                    {valueDisplay}
                  </span>
                  <Link
                    href={`https://explorer.doma.xyz/block/${tx.block_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] num text-accent hover:underline"
                  >
                    {tx.block_number}
                  </Link>
                  <Link
                    href={`https://explorer.doma.xyz/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {formatDate(tx.timestamp)}
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <p className="text-text-muted text-sm">No recent transactions found.</p>
            </div>
          )}
          </div>
        </div>
      </FadeIn>
    </>
  );
}
