# D3Stats - Analytics Dashboard for Doma Protocol

Real-time analytics dashboard for the [Doma Protocol](https://x.com/domaprotocol) ecosystem. Track chain activity, domain tokens, wallet scores, and network health on Doma chain.

## What is D3Stats?

D3Stats provides a comprehensive view of the Doma blockchain - the first DNS-compatible chain for DomainFi. It aggregates on-chain data and presents it through an intuitive dashboard that helps users understand network activity, discover domain tokens, and evaluate their own wallet performance.

## Features

### Dashboard
- **KPI Overview** - Total transactions, addresses, registered domains (1K+), subdomains minted (21K+), tokenized domains (98+), block time
- **Transaction Chart** - Daily transaction volume with 7D/14D/30D range selector, area chart with glow effects
- **Network Pulse** - Live block feed with gas utilization, block time heartbeat indicator
- **Top Domains** - Domain tokens ranked by holder count with TLD filtering and sorting

### Domain Explorer (`/domains`)
- Full paginated table of 400+ tokenized domain names on Doma chain
- Search by domain name, filter by TLD (.xyz, .com, .ai, etc.)
- Sort by holders or supply
- Load more pagination through Blockscout API

### Wallet Checker (`/wallet`)
- Enter any Doma address and get a detailed wallet analysis
- Personality system with 10 unique profiles (Gigachad, Chain Whale, Power User, etc.)
- Percentile ranking across transactions, balance, and token holdings
- Radar chart visualization of wallet profile
- Share results on X with one click
- Example wallets to try: Whale, Active, Newcomer

### Token Detail (`/token/[address]`)
- Holder distribution donut chart
- Top holders table with share percentages
- Recent transfer history
- Contract info and explorer link

### Trades (`/trades`)
- Full transaction feed with decoded method names
- Color-coded by type: token transfers (green), contract calls (purple)
- Links to block explorer for each transaction

### Top Accounts (`/whales`)
- 100 addresses across 2 pages from Blockscout
- Balance bars, transaction counts, contract/wallet type badges
- Links to address detail pages

### Domain Comparison (`/compare`)
- Select 2-3 domain tokens and compare side-by-side
- Holders, supply, transfer counts, holder concentration

## Data Sources

All data comes from the public [Doma Blockscout Explorer API](https://explorer.doma.xyz):

| Endpoint | Data |
|----------|------|
| `/api/v2/stats` | Chain stats, gas prices, utilization |
| `/api/v2/tokens` | ERC-20 domain tokens with pagination |
| `/api/v2/tokens/{hash}/counters` | Holder and transfer counts per token |
| `/api/v2/tokens/{hash}/holders` | Top holders list |
| `/api/v2/addresses` | Top accounts by balance |
| `/api/v2/transactions` | Recent transaction feed |
| `/api/v2/main-page/blocks` | Latest blocks with gas data |
| `/api/v2/search` | Search across tokens, addresses, transactions |

DOMA Domains NFT (`0xd000...D318`) and DOMA Synthetic Tokens (`0xD000...12BE`) are used for domain registration and subdomain statistics.

Data refreshes automatically via ISR (Incremental Static Regeneration) every 30 seconds.

## Tech Stack

- **Next.js 16** with App Router, Server Components, ISR
- **TypeScript** - strict mode
- **Tailwind CSS v4** - custom design system with card tiers, semantic colors
- **Recharts** - area charts, radar charts, donut charts
- **Three.js** - 3D animated splash screen (morphing chrome knot)
- **Lucide React** - icon system

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

```
src/
  app/
    (dashboard)/        # Route group with shared sidebar + header layout
      page.tsx          # Main dashboard (server component, ISR)
      domains/          # Domain explorer
      wallet/           # Wallet checker (client component)
      trades/           # Transaction feed
      whales/           # Top accounts
      token/[address]/  # Token detail (dynamic)
      address/[hash]/   # Address detail (dynamic)
      compare/          # Domain comparison
    api/explorer/       # Proxy route for Blockscout API (CORS)
  components/           # UI components
  hooks/                # useInView, useCountUp, useKeyboardShortcuts
  lib/doma-api.ts       # Data layer - all Blockscout API calls
```

## Author

Built by [Max Wayld](https://x.com/MaxWayld) for [Doma Protocol](https://x.com/domaprotocol)
