"use client";

import { useMemo } from "react";
import Link from "next/link";
import { shortenAddress, weiToEth, formatLargeNumber, type AddressItem } from "@/lib/doma-api";
import { useInView } from "@/hooks/useInView";

interface Props {
  addresses: AddressItem[];
}

const KNOWN_CONTRACT_NAMES = ["Proxy", "WETH", "StargatePoolNative"];

function isKnownContract(addr: AddressItem): boolean {
  if (addr.is_contract) return true;
  if (addr.name && KNOWN_CONTRACT_NAMES.some((n) => addr.name!.includes(n))) return true;
  return false;
}

export default function WhaleTracker({ addresses }: Props) {
  const { ref, row } = useInView();

  // Filter out contracts, but if all are contracts show them with a label
  const { display, allContracts } = useMemo(() => {
    const eoas = addresses.filter((a) => !isKnownContract(a));
    if (eoas.length > 0) {
      return { display: eoas.slice(0, 12), allContracts: false };
    }
    return { display: addresses.slice(0, 12), allContracts: true };
  }, [addresses]);

  const maxBalance = useMemo(() => {
    if (display.length === 0) return 1;
    return Math.max(...display.map(a => weiToEth(a.coin_balance)));
  }, [display]);

  return (
    <div ref={ref} className="card-primary p-5 h-full flex flex-col">
      <span style={row(0)} className="text-[13px] font-medium text-text-secondary uppercase tracking-wider mb-3">
        Top Accounts
      </span>

      <div className="flex-1 overflow-y-auto max-h-[380px] scroll-fade pr-2">
        {display.map((addr, i) => {
          const ethBalance = weiToEth(addr.coin_balance);
          const displayName = addr.name || shortenAddress(addr.hash);
          const showContractLabel = allContracts && isKnownContract(addr);

          return (
            <div
              key={addr.hash}
              style={row(i * 50)}
              className="py-3 border-b border-border/30 last:border-0 flex items-center justify-between"
            >
              <div className="flex flex-col">
                <Link
                  href={`/address/${addr.hash}`}
                  className={`text-[14px] font-medium hover:text-accent transition-colors ${
                    addr.ens_domain_name ? "text-accent" : "text-text-primary"
                  }`}
                >
                  {addr.ens_domain_name || displayName}
                  {showContractLabel && (
                    <span className="text-[11px] text-text-muted font-normal ml-1.5">
                      (contract)
                    </span>
                  )}
                </Link>
                <span className="text-[11px] text-text-muted">
                  {formatLargeNumber(addr.transactions_count)} txns
                </span>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] num text-text-primary">
                    {ethBalance.toFixed(2)} ETH
                  </span>
                  <Link href={`/address/${addr.hash}`} className="text-[10px] text-text-muted hover:text-accent transition-colors">
                    View
                  </Link>
                </div>
                <div className="w-12 h-1 rounded-full bg-bg-surface overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(ethBalance / maxBalance) * 100}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
