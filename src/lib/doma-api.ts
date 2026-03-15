// ═══════════════════════════════════════════
// Doma Chain Data Layer
// Source: Blockscout Explorer API (public)
// Chain: Doma (ID: 97477)
// ═══════════════════════════════════════════

const EXPLORER = "https://explorer.doma.xyz/api/v2";

/** Encode next_page_params for Blockscout pagination. Handles null -> empty, boolean -> lowercase. */
export function encodePageParams(params: Record<string, string | number | boolean | null>): string {
  return Object.entries(params)
    .map(([k, v]) => {
      if (v === null) return `${k}=`;
      if (typeof v === "boolean") return `${k}=${v ? "true" : "false"}`;
      return `${k}=${encodeURIComponent(String(v))}`;
    })
    .join("&");
}

async function get<T>(path: string, revalidate = 30): Promise<T> {
  const res = await fetch(`${EXPLORER}${path}`, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Explorer API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ─── Types ───

export interface ChainStats {
  total_addresses: string;
  total_blocks: string;
  total_transactions: string;
  transactions_today: string;
  average_block_time: number;
  gas_prices: { slow: number; average: number; fast: number };
  network_utilization_percentage: number;
  gas_used_today: string;
}

export interface TokenItem {
  address_hash: string;
  name: string | null;
  symbol: string | null;
  decimals: string | null;
  holders_count: string | null;
  total_supply: string | null;
  type: string;
}

export interface TokenCounters {
  token_holders_count: string;
  transfers_count: string;
}

export interface TokenHolder {
  address: {
    hash: string;
    name: string | null;
    is_contract: boolean;
    is_verified: boolean;
    implementations: { address_hash: string; name: string | null }[];
  };
  value: string;
  token_id: string | null;
}

export interface TxItem {
  hash: string;
  from: { hash: string; name: string | null };
  to: { hash: string; name: string | null } | null;
  value: string;
  fee: { value: string } | null;
  timestamp: string;
  method: string | null;
  status: string;
  block_number: number;
  decoded_input: { method_call: string } | null;
  token_transfers: TokenTransfer[] | null;
}

export interface TokenTransfer {
  from: { hash: string };
  to: { hash: string };
  token: { name: string | null; symbol: string | null; address: string };
  total: { value: string; decimals: string | null };
  type: string;
}

export interface AddressItem {
  hash: string;
  name: string | null;
  coin_balance: string;
  transactions_count: string;
  ens_domain_name: string | null;
  is_contract: boolean;
}

export interface BlockItem {
  height: number;
  timestamp: string;
  transactions_count: number;
  gas_used: string;
  gas_used_percentage: number;
  gas_limit: string;
  base_fee_per_gas: string;
  size: number;
  hash: string;
}

export interface ChartDataPoint {
  date: string;
  transactions_count: number;
}

export interface SearchResult {
  address_hash?: string;
  name?: string;
  symbol?: string;
  type: string;
  token_url?: string;
  address_url?: string;
  token_type?: string;
  total_supply?: string;
}

// ─── Contract addresses ───
const DOMA_DOMAINS_NFT = "0xd000000000009E6bEa0bA0c5D964AE98d59ED318";
const DOMA_SYNTHETIC_NFT = "0xD000000000870B8925775D7536ab8372305412BE";

// ─── Fetchers ───

export async function fetchChainStats(): Promise<ChainStats> {
  return get<ChainStats>("/stats");
}

export interface DomainStats {
  registeredDomains: number;  // DOMA Domains NFT holders (owners)
  syntheticSubdomains: number; // DOMA Synthetic Tokens holders
  domainTransfers: number;
  subdomainTransfers: number;
}

export async function fetchDomainStats(): Promise<DomainStats> {
  const [domainsRes, syntheticsRes] = await Promise.allSettled([
    get<TokenCounters>(`/tokens/${DOMA_DOMAINS_NFT}/counters`),
    get<TokenCounters>(`/tokens/${DOMA_SYNTHETIC_NFT}/counters`),
  ]);

  return {
    registeredDomains: domainsRes.status === "fulfilled"
      ? parseInt(domainsRes.value.token_holders_count) || 0 : 0,
    syntheticSubdomains: syntheticsRes.status === "fulfilled"
      ? parseInt(syntheticsRes.value.token_holders_count) || 0 : 0,
    domainTransfers: domainsRes.status === "fulfilled"
      ? parseInt(domainsRes.value.transfers_count) || 0 : 0,
    subdomainTransfers: syntheticsRes.status === "fulfilled"
      ? parseInt(syntheticsRes.value.transfers_count) || 0 : 0,
  };
}

interface TokenPageResponse {
  items: TokenItem[];
  next_page_params: Record<string, string | number | boolean | null> | null;
}

/**
 * Fetch multiple pages of tokens with working Blockscout pagination.
 * Key trick: null values in next_page_params must be sent as empty strings.
 */
export async function fetchAllTokensPaginated(pages = 2): Promise<{
  tokens: TokenItem[];
  hasMore: boolean;
  nextPageParams: Record<string, string | number | boolean | null> | null;
}> {
  const allTokens: TokenItem[] = [];
  let nextParams: Record<string, string | number | boolean | null> | null = null;

  for (let page = 0; page < pages; page++) {
    let url = "/tokens?type=ERC-20&sort=holders_count&order=desc";

    if (nextParams) {
      url += `&${encodePageParams(nextParams)}`;
    }

    const res = await get<TokenPageResponse>(url);
    allTokens.push(...res.items);
    nextParams = res.next_page_params;

    if (!nextParams) break;
  }

  return {
    tokens: allTokens,
    hasMore: nextParams !== null,
    nextPageParams: nextParams,
  };
}

export async function fetchTokenCounters(address: string): Promise<TokenCounters> {
  return get<TokenCounters>(`/tokens/${address}/counters`);
}

export async function fetchTokenHolders(address: string): Promise<TokenHolder[]> {
  const res = await get<{ items: TokenHolder[] }>(`/tokens/${address}/holders`);
  return res.items;
}

export async function fetchTokenDetail(address: string): Promise<TokenItem> {
  return get<TokenItem>(`/tokens/${address}`);
}

export async function fetchTokenTransfersByToken(address: string): Promise<TokenTransfer[]> {
  const res = await get<{ items: TokenTransfer[] }>(`/tokens/${address}/transfers`);
  return res.items;
}

export async function fetchTransactionChart(): Promise<ChartDataPoint[]> {
  const res = await get<{ chart_data: ChartDataPoint[] }>(
    "/stats/charts/transactions"
  );
  return res.chart_data;
}

export async function fetchRecentTransactions(): Promise<TxItem[]> {
  const res = await get<{ items: TxItem[] }>("/transactions");
  return res.items;
}

export async function fetchRecentBlocks(): Promise<BlockItem[]> {
  const res = await get<BlockItem[]>("/main-page/blocks", 10);
  return res;
}

export async function fetchTopAddresses(): Promise<AddressItem[]> {
  const res = await get<{ items: AddressItem[] }>(
    "/addresses?sort=balance&order=desc"
  );
  return res.items;
}

interface AddressPageResponse {
  items: AddressItem[];
  next_page_params: Record<string, string | number | boolean | null> | null;
}

/** Fetch multiple pages of addresses (for Whales page). */
export async function fetchAllAddresses(pages = 2): Promise<AddressItem[]> {
  const all: AddressItem[] = [];
  let nextParams: Record<string, string | number | boolean | null> | null = null;

  for (let page = 0; page < pages; page++) {
    let url = "/addresses?sort=balance&order=desc";
    if (nextParams) {
      url += `&${encodePageParams(nextParams)}`;
    }

    const res = await get<AddressPageResponse>(url);
    all.push(...res.items);
    nextParams = res.next_page_params;
    if (!nextParams) break;
  }
  return all;
}

export async function fetchAddressDetail(hash: string): Promise<AddressItem> {
  return get<AddressItem>(`/addresses/${hash}`);
}

export async function fetchAddressTokens(hash: string): Promise<AddressTokenHolding[]> {
  const res = await get<{ items: AddressTokenHolding[] }>(`/addresses/${hash}/tokens`);
  return res.items;
}

// ─── Wallet Checker ───

export interface AddressDetail {
  hash: string;
  name: string | null;
  coin_balance: string;
  is_contract: boolean;
  has_token_transfers: boolean;
  has_tokens: boolean;
}

export interface AddressCounters {
  transactions_count: string;
  gas_usage_count: string;
  token_transfers_count: string;
  validations_count: string;
}

export interface AddressTokenHolding {
  token: {
    address_hash: string;
    name: string | null;
    symbol: string | null;
    decimals: string | null;
    holders_count: string | null;
    total_supply: string | null;
    type: string;
  };
  value: string;
  token_id: string | null;
}

export interface WalletScore {
  address: string;
  balance: number;
  transactionCount: number;
  tokenTransferCount: number;
  gasUsed: number;
  domainTokensHeld: number;
  totalTokensHeld: number;
  isContract: boolean;
  // percentiles (0-100, higher = better than X% of users)
  txPercentile: number;
  balancePercentile: number;
  tokensPercentile: number;
  overallScore: number; // 0-100
  tier: "Diamond" | "Gold" | "Silver" | "Bronze" | "Newcomer";
}

export function computeWalletScore(
  detail: AddressDetail,
  counters: AddressCounters,
  holdings: AddressTokenHolding[],
  totalAddresses: number,
): WalletScore {
  const balance = weiToEth(detail.coin_balance || "0");
  const txCount = parseInt(counters.transactions_count) || 0;
  const ttCount = parseInt(counters.token_transfers_count) || 0;
  const gasUsed = parseInt(counters.gas_usage_count) || 0;

  const domainTokens = holdings.filter(
    (h) => h.token.symbol && DOMAIN_TLD_RE.test(h.token.symbol)
  );

  // Percentile estimation based on power-law distribution
  // Most addresses have 0 txns, top addresses have thousands
  // Using log-scale approximation
  const txPercentile = Math.min(100, Math.round(
    txCount === 0 ? 0 :
    txCount < 5 ? 25 :
    txCount < 20 ? 50 :
    txCount < 100 ? 70 :
    txCount < 500 ? 85 :
    txCount < 2000 ? 95 :
    99
  ));

  const balancePercentile = Math.min(100, Math.round(
    balance === 0 ? 0 :
    balance < 0.001 ? 30 :
    balance < 0.01 ? 50 :
    balance < 0.1 ? 70 :
    balance < 1 ? 85 :
    balance < 10 ? 95 :
    99
  ));

  const tokensPercentile = Math.min(100, Math.round(
    holdings.length === 0 ? 0 :
    holdings.length < 2 ? 40 :
    holdings.length < 5 ? 60 :
    holdings.length < 10 ? 80 :
    holdings.length < 20 ? 90 :
    98
  ));

  const overallScore = Math.round(
    txPercentile * 0.4 + balancePercentile * 0.25 + tokensPercentile * 0.35
  );

  const tier: WalletScore["tier"] =
    overallScore >= 90 ? "Diamond" :
    overallScore >= 70 ? "Gold" :
    overallScore >= 50 ? "Silver" :
    overallScore >= 25 ? "Bronze" :
    "Newcomer";

  return {
    address: detail.hash,
    balance,
    transactionCount: txCount,
    tokenTransferCount: ttCount,
    gasUsed,
    domainTokensHeld: domainTokens.length,
    totalTokensHeld: holdings.length,
    isContract: detail.is_contract,
    txPercentile,
    balancePercentile,
    tokensPercentile,
    overallScore,
    tier,
  };
}

// ─── Helpers ───

const DOMAIN_TLD_RE = /\.(com|xyz|ai|tech|cyou|org|net|io|co|fun|app|dev|world|club)$/i;

export function isDomainToken(token: TokenItem): boolean {
  if (!token.name || !token.symbol) return false;
  return DOMAIN_TLD_RE.test(token.symbol);
}

export function isDomainSymbol(symbol: string): boolean {
  return DOMAIN_TLD_RE.test(symbol);
}

export function extractTLD(symbol: string): string {
  const match = symbol.match(/\.([a-z]+)$/i);
  return match ? `.${match[1].toLowerCase()}` : "other";
}

export function formatLargeNumber(n: number | string): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "0";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString("en-US");
}

export function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || "-";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Known method selectors -> human names
const METHOD_NAMES: Record<string, string> = {
  "0xa9059cbb": "transfer",
  "0x095ea7b3": "approve",
  "0x23b872dd": "transferFrom",
  "0x3593564c": "execute",
  "0x87517c45": "swap",
  "0x3db6be2b": "deposit",
  "0x2e1a7d4d": "withdraw",
  "0x38ed1739": "swapExact",
};

export function formatMethod(method: string | null, decoded: { method_call: string } | null): string {
  if (decoded?.method_call) {
    const name = decoded.method_call.split("(")[0];
    return name.length > 16 ? name.slice(0, 14) + ".." : name;
  }
  if (!method) return "transfer";
  const known = METHOD_NAMES[method.slice(0, 10)];
  if (known) return known;
  return method.slice(0, 10);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function weiToEth(wei: string): number {
  if (!wei) return 0;
  const parsed = parseFloat(wei);
  return isNaN(parsed) ? 0 : parsed / 1e18;
}

export function tokenAmount(raw: string, decimals: string | null): number {
  const d = decimals ? parseInt(decimals) : 18;
  return parseFloat(raw) / Math.pow(10, d);
}

export function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function computeTLDDistribution(tokens: TokenItem[]) {
  const map: Record<string, number> = {};
  for (const t of tokens) {
    if (!t.symbol) continue;
    const tld = extractTLD(t.symbol);
    map[tld] = (map[tld] || 0) + 1;
  }
  return Object.entries(map)
    .map(([name, count]) => ({ name, count, pct: 0 }))
    .sort((a, b) => b.count - a.count)
    .map((item, _, arr) => {
      const total = arr.reduce((s, x) => s + x.count, 0);
      return { ...item, pct: Math.round((item.count / total) * 100) };
    });
}

/** Shared TLD color mapping — used by TopDomains and DomainsTable */
export function tldColor(tld: string): string {
  if (tld === ".xyz") return "text-accent";
  if (tld === ".com") return "text-text-secondary";
  if (tld === ".ai") return "text-text-primary";
  return "text-text-muted";
}
