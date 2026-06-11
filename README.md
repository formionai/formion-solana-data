# formion-solana-data

**Key-free TypeScript client for live Solana DEX flow.** Wraps [GeckoTerminal](https://www.geckoterminal.com/)'s public API (no API key required) and returns normalised pool rows — 24h **volume**, **liquidity**, **price change** and **buy/sell pressure** — across Raydium, Orca, Meteora, Pumpswap and more.

Built and open-sourced by **[Formion](https://formion.ai)** — the AI trading terminal that puts every market on one screen. This is the data layer behind our free public **[Solana DEX Flow](https://app.formion.ai/scan/solana-dex-flow)** page.

## Install

```bash
npm i formion-solana-data
# or just copy src/index.ts — it's a single dependency-free file
```

Requires a runtime with global `fetch` + `AbortSignal.timeout` (Node 18+, Bun, Deno, modern browsers). Pass your own `fetchImpl` otherwise.

## Usage

```ts
import { getSolanaFlow } from "formion-solana-data";

// Trending Solana pools (the live "flow")
const rows = await getSolanaFlow();

// Top pools for a specific DEX, sorted by 24h volume
const raydium = await getSolanaFlow("raydium");

console.log(rows[0]);
// {
//   pool: "SOL / USDC", dex: "raydium", base: "SOL", quote: "USDC",
//   priceUsd: 1.23, vol24: 22000000, liq: 4500000,
//   chg24: -3.2, buys24: 34543, sells24: 37060,
//   buyPressure: 48.2, fdv: ..., geckoUrl: "https://www.geckoterminal.com/solana/pools/..."
// }
```

### Supported DEX filters

`all` (trending) · `raydium` · `orca` · `meteora` · `pumpswap` · `raydium-clmm` · `meteora-damm-v2`

```ts
import { SOLANA_DEXES } from "formion-solana-data";
```

## API

### `getSolanaFlow(dex?, opts?) => Promise<SolanaPool[]>`
- `dex`: `"all"` (default, trending pools) or a DEX id (top pools by 24h volume).
- `opts.timeoutMs`: upstream timeout (default `9000`).
- `opts.fetchImpl`: custom `fetch` (Node <18 / testing).

### `SolanaPool`
`pool, poolAddress, dex, base, quote, priceUsd, vol24, vol1h, liq, chg24, chg1h, buys24, sells24, buyers24, sellers24, buyPressure (0–100), fdv, geckoUrl`

## Rate limits & caching
GeckoTerminal's free public API allows ~30 requests/minute. For a public-facing site, cache results server-side (Formion caches 60s per DEX). Don't call this from every client.

## Why
A Solana trader shouldn't need five tabs to see where flow is going. This is a small piece of [Formion](https://formion.ai)'s free Solana intelligence layer — DEX flow today, a token screener and smart-money tracker next. Contributions welcome.

## License
MIT © 2026 Formion (formion.ai)
