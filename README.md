<div align="center">

<img src="https://raw.githubusercontent.com/formionai/formion-solana-data/main/assets/banner.png" alt="formion-solana-data" width="60%" />

# formion-solana-data

**Live Solana DEX flow in your terminal — no API key.**

[![Try it](https://img.shields.io/badge/npx-run_it_now-CB3837?logo=npm&logoColor=white)](#-try-it-now-no-install-no-key)
[![No API key](https://img.shields.io/badge/API_key-not_required-22c55e)](#)
[![Node](https://img.shields.io/badge/node-%E2%89%A522-339933?logo=node.js&logoColor=white)](#)
[![Zero deps](https://img.shields.io/badge/dependencies-0-blue)](#)
[![License](https://img.shields.io/badge/license-MIT-555)](LICENSE)
[![Formion](https://img.shields.io/badge/by-Formion-7c3aed)](https://formion.ai)

</div>

See where Solana money is moving — 24h **volume**, **liquidity**, **price change** and **buy/sell pressure** across **Raydium, Orca, Meteora & Pumpswap** — in one command. Wraps [GeckoTerminal](https://www.geckoterminal.com/)'s public API (no key, ~30 req/min), zero dependencies, single TypeScript file.

## ⚡ Try it now (no install, no key)

```bash
npx github:formionai/formion-solana-data
```

```
  ◆ FORMION  ·  Solana DEX Flow  ·  🔥 Trending Solana pools
  2026-06-11 12:24:08 UTC   data: GeckoTerminal (key-free)
  ────────────────────────────────────────────────────────────────────────────────
  POOL                DEX                   PRICE      24H VOL         LIQ      24H%   BUY/SELL FLOW
  ────────────────────────────────────────────────────────────────────────────────
  SPCX / SOL          meteora-damm…        $12.70     $157.19M      $53.20  +3256k%   ███████░░░ 75%
  SOL / USDC          raydium-clmm         $65.07      $21.75M      $4.77M    +2.7%   █████░░░░░ 47%
  KINS / SOL          pumpswap           $0.00962       $4.44M     $291.2K  +121.4%   █████░░░░░ 52%
  Gaejook / SOL       pumpswap          $0.000106       $3.92M      $28.2K   -35.5%   ██████░░░░ 64%
  BIBI / SOL          pumpswap         $0.0000588       $3.59M      $19.3K   -81.5%   █████░░░░░ 54%
  1B / USDC           pumpswap          $0.000582       $3.46M      $85.1K  +913.1%   ███░░░░░░░ 33%
  pippin / SOL        raydium             $0.0202        $2.42M      $3.20M  -11.6%   ██████░░░░ 58%
  ────────────────────────────────────────────────────────────────────────────────
  Full multi-market terminal (CEX + DEX + AI signals) → https://app.formion.ai/scan/solana-dex-flow
```

The green/red bar is **buy vs sell pressure** (share of 24h transactions). Live, refreshes on demand.

### CLI options

```bash
npx github:formionai/formion-solana-data raydium          # top Raydium pools
npx github:formionai/formion-solana-data --sort chg24     # biggest 24h movers
npx github:formionai/formion-solana-data --watch 10 -n 25 # live, refresh every 10s
npx github:formionai/formion-solana-data --json | jq '.[0]'   # raw data → jq
```

| flag | meaning |
|---|---|
| `[dex]` | `all` (trending, default) · `raydium` · `orca` · `meteora` · `pumpswap` · `raydium-clmm` · `meteora-damm-v2` |
| `-n, --limit <n>` | rows to show (default 15) |
| `-w, --watch <sec>` | refresh every `<sec>` seconds |
| `--sort <field>` | `vol24` (default) · `liq` · `chg24` · `buyPressure` |
| `--json` | raw JSON for piping |

## 📦 Use it as a library

```bash
npm i github:formionai/formion-solana-data
# …or just copy src/index.ts — it's one dependency-free file
```

```ts
import { getSolanaFlow } from "formion-solana-data";

const rows = await getSolanaFlow();           // trending Solana pools
const raydium = await getSolanaFlow("raydium"); // top Raydium pools by 24h volume

console.log(rows[0]);
// {
//   pool: "SOL / USDC", dex: "raydium", base: "SOL", quote: "USDC",
//   priceUsd: 1.23, vol24: 22000000, liq: 4500000,
//   chg24: -3.2, buys24: 34543, sells24: 37060,
//   buyPressure: 48.2, fdv: ..., geckoUrl: "https://www.geckoterminal.com/solana/pools/..."
// }
```

Runs anywhere with global `fetch` + `AbortSignal.timeout` — Node 18+, Bun, Deno, modern browsers. Pass `{ fetchImpl }` otherwise.

### API

**`getSolanaFlow(dex?, opts?) => Promise<SolanaPool[]>`**
- `dex` — `"all"` (default, trending pools) or a DEX id (top pools by 24h volume)
- `opts.timeoutMs` — upstream timeout (default `9000`)
- `opts.fetchImpl` — custom `fetch` (Node <18 / testing)

**`SolanaPool`** — `pool, poolAddress, dex, base, quote, priceUsd, vol24, vol1h, liq, chg24, chg1h, buys24, sells24, buyers24, sellers24, buyPressure (0–100), fdv, geckoUrl`

## 🧠 Build ideas

- A Telegram/Discord bot that pings when `buyPressure > 70%` on a fresh pool
- A "new liquidity" watcher across Raydium + Meteora
- Feed `chg24` + `vol24` into your own momentum screener
- A live dashboard tile (the data behind Formion's own [Solana DEX Flow](https://app.formion.ai/scan/solana-dex-flow))

## Rate limits & caching

GeckoTerminal's free API allows ~30 req/min. For anything public-facing, cache server-side (Formion caches 60s per DEX). Don't call it from every browser client.

## Why this exists

A Solana trader shouldn't need five tabs to see where flow is going. This is one small, free piece of **[Formion](https://formion.ai)** — the AI trading terminal that puts every market (CEX + DEX + stocks + AI signals) on one screen. DEX flow today; token screener and smart-money tracker next. PRs welcome.

> **Want the full picture?** Formion turns this raw flow into AI signals, alerts, backtests and one-click automation across every market → **[app.formion.ai](https://app.formion.ai/scan/solana-dex-flow)**

## License

MIT © 2026 [Formion](https://formion.ai)
