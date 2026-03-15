"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  computeWalletScore,
  formatLargeNumber,
  isDomainSymbol,
  type WalletScore,
  type AddressTokenHolding,
} from "@/lib/doma-api";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

const API = "/api/explorer";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

// ── Personality system ──
function getPersonality(score: WalletScore) {
  const s = score.overallScore;
  const txs = score.transactionCount;
  const tokens = score.totalTokensHeld;
  const domains = score.domainTokensHeld;
  const bal = score.balance;

  // Special cases first (these override score)
  if (txs === 0 && tokens === 0 && bal === 0) return {
    emoji: "👻",
    title: "Ghost Wallet",
    desc: "This wallet exists in theory only. Zero transactions, zero tokens, zero drama. A true minimalist.",
  };
  if (txs === 0 && bal > 0) return {
    emoji: "🧊",
    title: "Frozen Asset",
    desc: "Got ETH but never spent it. Either diamond hands or forgot the private key. We'll never know.",
  };
  if (domains > 10) return {
    emoji: "🏰",
    title: "Domain Baron",
    desc: `Sitting on ${domains} domain tokens. You're basically the landlord of Web3 real estate.`,
  };
  // Then score-based
  if (s >= 95) return {
    emoji: "👑",
    title: "Doma Gigachad",
    desc: "You practically live on-chain. The validators know you by name. Touch grass? No, you touch blocks.",
  };
  if (s >= 85) return {
    emoji: "🐋",
    title: "Chain Whale",
    desc: "Heavy bags, heavy transactions. You move markets when you sneeze. Other wallets look up to you (literally).",
  };
  if (s >= 70) return {
    emoji: "⚡",
    title: "Power User",
    desc: "You know your way around Doma like it's your backyard. Swapping, staking, collecting - the full crypto breakfast.",
  };
  if (s >= 55) return {
    emoji: "🏄",
    title: "Active Explorer",
    desc: "You're out here making moves. Not the biggest fish, but you swim with purpose. Keep riding those waves.",
  };
  if (s >= 40) return {
    emoji: "🌱",
    title: "Growing Seed",
    desc: "You've planted the flag and started exploring. A few more transactions and you'll be in the big leagues.",
  };
  if (s >= 25) return {
    emoji: "🐣",
    title: "Fresh Hatchling",
    desc: "Just arrived on Doma chain. The world is your oyster and the gas is cheap. Go make some noise!",
  };
  return {
    emoji: "🔍",
    title: "Newcomer",
    desc: "Early days on Doma chain. Everyone starts somewhere - your on-chain story is just beginning.",
  };
}

function getBarLabel(pct: number): string {
  if (pct >= 99) return "Top 1% - absolute legend";
  if (pct >= 95) return "Top 5% - elite tier";
  if (pct >= 85) return "Top 15% - well above average";
  if (pct >= 70) return "Top 30% - solid player";
  if (pct >= 50) return "Top 50% - right in the middle";
  if (pct >= 25) return "Top 75% - getting started";
  return "Just warming up";
}

export default function WalletCheckerPage() {
  const searchParams = useSearchParams();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<WalletScore | null>(null);
  const [holdings, setHoldings] = useState<AddressTokenHolding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [totalAddresses, setTotalAddresses] = useState("...");
  const autoChecked = useRef(false);

  useEffect(() => {
    const addr = searchParams.get("address");
    if (addr && addr.startsWith("0x") && addr.length === 42 && !autoChecked.current) {
      autoChecked.current = true;
      setAddress(addr);
      runCheck(addr);
    }
  }, [searchParams]);

  async function runCheck(checkAddress: string) {
    const trimmed = checkAddress.trim();
    if (!trimmed.startsWith("0x") || trimmed.length !== 42) {
      setError("That doesn't look like a wallet address. Need 0x + 40 hex chars.");
      return;
    }

    setLoading(true);
    setError(null);
    setScore(null);
    setHoldings([]);
    setShowResult(false);

    try {
      const [detailRes, countersRes, holdingsRes, statsRes] =
        await Promise.allSettled([
          fetchJSON<{ hash: string; name: string | null; coin_balance: string; is_contract: boolean; has_token_transfers: boolean; has_tokens: boolean }>(`${API}/addresses/${trimmed}`),
          fetchJSON<{ transactions_count: string; gas_usage_count: string; token_transfers_count: string; validations_count: string }>(`${API}/addresses/${trimmed}/counters`),
          fetchJSON<{ items: AddressTokenHolding[] }>(`${API}/addresses/${trimmed}/tokens`),
          fetchJSON<{ total_addresses: string }>(`${API}/stats`),
        ]);

      if (detailRes.status === "rejected") {
        setError("Can't find this address on Doma chain. Double-check and try again.");
        setLoading(false);
        return;
      }

      const detail = detailRes.value;
      const counters = countersRes.status === "fulfilled" ? countersRes.value : { transactions_count: "0", gas_usage_count: "0", token_transfers_count: "0", validations_count: "0" };
      const tokenHoldings = holdingsRes.status === "fulfilled" ? holdingsRes.value.items : [];
      const totalAddressesCount = statsRes.status === "fulfilled" ? parseInt(statsRes.value.total_addresses) || 1 : 1;

      if (statsRes.status === "fulfilled" && statsRes.value.total_addresses) {
        setTotalAddresses(formatLargeNumber(statsRes.value.total_addresses) + "+");
      }

      setScore(computeWalletScore(detail, counters, tokenHoldings, totalAddressesCount));
      setHoldings(tokenHoldings);

      // Stagger reveal
      setTimeout(() => setShowResult(true), 50);
    } catch {
      setError("Something broke. Try again in a sec.");
    } finally {
      setLoading(false);
    }
  }

  function handleCheck() {
    runCheck(address);
  }

  const domainHoldings = holdings.filter((h) => h.token.symbol && isDomainSymbol(h.token.symbol));
  const personality = score ? getPersonality(score) : null;

  const reveal = (delay: number) => ({
    opacity: showResult ? 1 : 0,
    transform: showResult ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
  });

  return (
    <div className="pt-8 pb-12">
      {/* Header */}
      <h1 className="text-[32px] font-light text-text-primary tracking-tight">
        Wallet Checker
      </h1>
      <p className="text-[15px] text-text-muted mt-2 max-w-[480px]">
        Paste any Doma address and see how it stacks up against{" "}
        <span className="text-text-secondary">{totalAddresses}</span> wallets on the chain.
      </p>

      {/* Input */}
      <div className="mt-8 flex gap-3 max-w-[600px]">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleCheck(); }}
          placeholder="0x..."
          className="flex-1 h-12 px-4 text-[15px] rounded-lg bg-bg-card border border-border text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={handleCheck}
          disabled={loading}
          className="btn-accent h-12 px-8"
        >
          {loading ? "Analyzing..." : "Check"}
        </button>
      </div>

      {/* Example wallets */}
      {!score && !loading && (
        <div className="mt-4 flex items-center gap-2 text-[12px] text-text-muted">
          <span>Try:</span>
          {/* NOTE: These example addresses are from real Doma chain accounts.
              Update periodically if they become inactive.
              Whale: high balance, Active: many txns, Newcomer: INVESTORS.xyz holder */}
          {[
            { label: "Whale", addr: "0xf70da97812CB96acDF810712Aa562db8dfA3dbEF" },
            { label: "Active", addr: "0x53fED91Ac5732FcFB57EB229f2284827d89462c5" },
            { label: "Newcomer", addr: "0x2e7654FfbD721eE80ae27A4Ee10184333592323e" },
          ].map((ex) => (
            <button
              key={ex.label}
              onClick={() => { setAddress(ex.addr); runCheck(ex.addr); }}
              className="px-2.5 py-1 rounded-md border border-border text-text-muted hover:text-accent hover:border-accent transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-[14px] text-red">{error}</p>}

      {/* ═══ Results ═══ */}
      {score && personality && (
        <div className="mt-12">
          {/* Personality card */}
          <div className="bg-bg-card border border-border rounded-xl p-8 max-w-[680px] card-glow" style={reveal(0)}>
            <div className="flex items-start gap-5">
              <span className="text-[48px] leading-none">{personality.emoji}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-[24px] font-light text-text-primary tracking-tight">
                  {personality.title}
                </h2>
                <p className="text-[14px] text-text-secondary mt-2 leading-relaxed">
                  {personality.desc}
                </p>
              </div>
            </div>

            {/* Percentile headline */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-text-muted text-[13px] mb-1">Overall</p>
              <div className="flex items-baseline gap-3">
                <span className="text-[40px] font-extralight text-text-primary num tracking-tight">
                  Top {100 - score.overallScore}%
                </span>
                <span className="text-[14px] text-text-muted">
                  of all Doma wallets
                </span>
              </div>
              {/* Full-width bar */}
              <div className="h-[6px] rounded-full bg-bg-surface mt-4 w-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-[1.5s] ease-out"
                  style={{ width: showResult ? `${score.overallScore}%` : "0%" }}
                />
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="card-primary p-6 max-w-[680px] mt-6" style={reveal(60)}>
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <RadarChart data={[
                  { axis: "Transactions", value: score.txPercentile },
                  { axis: "Balance", value: score.balancePercentile },
                  { axis: "Tokens", value: score.tokensPercentile },
                  { axis: "Domains", value: Math.min(score.domainTokensHeld * 10, 100) },
                  { axis: "Gas Usage", value: Math.min(score.gasUsed / 1000000, 100) },
                ]}>
                  <PolarGrid stroke="#1e1e22" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: "#52525b", fontSize: 11 }} />
                  <Radar dataKey="value" stroke="#29b6f6" fill="#29b6f6" fillOpacity={0.15} strokeWidth={1.5} dot={false} animationDuration={800} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Three metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-[680px]">
            {/* Transactions */}
            <div className="bg-bg-card border border-border rounded-xl p-5 card-glow" style={reveal(120)}>
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-3">Transactions</p>
              <p className="text-[28px] font-extralight text-text-primary num tracking-tight">
                {score.transactionCount.toLocaleString("en-US")}
              </p>
              <div className="h-1 rounded-full bg-bg-surface mt-3 overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all duration-[1.2s] ease-out" style={{ width: showResult ? `${score.txPercentile}%` : "0%" }} />
              </div>
              <p className="text-[11px] text-text-muted mt-2">{getBarLabel(score.txPercentile)}</p>
            </div>

            {/* Balance */}
            <div className="bg-bg-card border border-border rounded-xl p-5 card-glow" style={reveal(200)}>
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-3">Balance</p>
              <p className="text-[28px] font-extralight text-text-primary num tracking-tight">
                {score.balance < 0.0001 ? "~0" : score.balance.toFixed(4)}
                <span className="text-[14px] text-text-muted ml-1">ETH</span>
              </p>
              <div className="h-1 rounded-full bg-bg-surface mt-3 overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all duration-[1.2s] ease-out" style={{ width: showResult ? `${score.balancePercentile}%` : "0%" }} />
              </div>
              <p className="text-[11px] text-text-muted mt-2">{getBarLabel(score.balancePercentile)}</p>
            </div>

            {/* Tokens */}
            <div className="bg-bg-card border border-border rounded-xl p-5 card-glow" style={reveal(280)}>
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-3">Tokens Held</p>
              <p className="text-[28px] font-extralight text-text-primary num tracking-tight">
                {score.totalTokensHeld}
                <span className="text-[14px] text-text-muted ml-1">{score.totalTokensHeld === 1 ? "token" : "tokens"}</span>
              </p>
              <div className="h-1 rounded-full bg-bg-surface mt-3 overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all duration-[1.2s] ease-out" style={{ width: showResult ? `${score.tokensPercentile}%` : "0%" }} />
              </div>
              <p className="text-[11px] text-text-muted mt-2">{getBarLabel(score.tokensPercentile)}</p>
            </div>
          </div>

          {/* Extra stats */}
          <div className="flex gap-10 mt-8 max-w-[680px]" style={reveal(360)}>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider">Token Transfers</p>
              <p className="text-[18px] font-light num text-text-primary mt-1">{score.tokenTransferCount.toLocaleString("en-US")}</p>
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider">Domain Names</p>
              <p className="text-[18px] font-light num text-text-primary mt-1">
                {score.domainTokensHeld}
                {score.domainTokensHeld === 0 && <span className="text-[12px] text-text-muted ml-2">none yet</span>}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider">Gas Burned</p>
              <p className="text-[18px] font-light num text-text-primary mt-1">{formatLargeNumber(score.gasUsed)}</p>
            </div>
          </div>

          {/* Share on X */}
          <div className="mt-6 max-w-[680px]" style={reveal(400)}>
            <button
              onClick={() => {
                const text = `My @domaprotocol wallet is ${personality.title} ${personality.emoji}\nTop ${100 - score.overallScore}% of all wallets\n${score.transactionCount.toLocaleString("en-US")} txns | ${score.totalTokensHeld} tokens | ${score.domainTokensHeld} domains\n\nCheck yours at d3stats.com/wallet`;
                window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
              }}
              className="btn-gradient h-9 px-5 text-[13px] rounded-lg"
            >
              Share on X
            </button>
          </div>

          {/* Domain tokens list */}
          {domainHoldings.length > 0 && (
            <div className="mt-8 max-w-[680px]" style={reveal(440)}>
              <p className="text-[13px] text-text-secondary font-medium mb-3">
                Domain Tokens in Wallet
              </p>
              <div className="bg-bg-card border border-border rounded-xl overflow-hidden card-glow">
                {domainHoldings.map((h, i) => {
                  const decimals = parseInt(h.token.decimals || "18") || 18;
                  const balance = parseFloat(h.value) / Math.pow(10, decimals);
                  return (
                    <div
                      key={h.token.address_hash}
                      className={`flex items-center justify-between px-5 py-3 ${i < domainHoldings.length - 1 ? "border-b border-border/30" : ""}`}
                    >
                      <span className="text-[14px] font-medium text-text-primary">{h.token.symbol}</span>
                      <span className="text-[13px] num text-text-secondary">
                        {balance.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contract warning */}
          {score.isContract && (
            <div className="mt-6 max-w-[680px] text-[13px] text-text-muted bg-bg-card border border-border rounded-lg px-4 py-3" style={reveal(500)}>
              This is a smart contract address, not a regular wallet. Stats may not reflect typical user activity.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
