#!/usr/bin/env -S node --experimental-strip-types
/**
 * formion-solana-data CLI — live Solana DEX flow in your terminal. No API key.
 *
 *   npx github:formionai/formion-solana-data            # trending pools
 *   npx github:formionai/formion-solana-data raydium    # top Raydium pools
 *   npx github:formionai/formion-solana-data --watch 15 # refresh every 15s
 *
 * Built by Formion (https://formion.ai) — the AI trading terminal.
 */
import { getSolanaFlow, SOLANA_DEXES, type SolanaDex, type SolanaPool } from "./index.ts";

// ── tiny ANSI helpers (zero deps) ────────────────────────────────────────────
const useColor = process.stdout.isTTY && process.env.NO_COLOR === undefined;
const c = (code: string) => (s: string | number) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const dim = c("2"), bold = c("1"), green = c("32"), red = c("31"),
  cyan = c("36"), yellow = c("33"), magenta = c("35"), gray = c("90");

// ── formatting ───────────────────────────────────────────────────────────────
function usd(n: number | null): string {
  if (n === null) return "—";
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  if (a >= 1) return `$${n.toFixed(2)}`;
  if (a > 0) return `$${n.toPrecision(3)}`;
  return "$0";
}
function pct(n: number | null): string {
  if (n === null) return dim("—");
  const sign = n >= 0 ? "+" : "";
  const a = Math.abs(n);
  const s = a >= 10000 ? `${sign}${Math.round(n / 1000)}k%`
    : a >= 1000 ? `${sign}${Math.round(n)}%`
    : `${sign}${n.toFixed(1)}%`;
  return n > 0 ? green(s) : n < 0 ? red(s) : dim(s);
}
/** 10-cell buy/sell pressure bar: green buys █ vs red sells ░ (readable even without color). */
function flowBar(buyPressure: number): string {
  const cells = 10;
  const buys = Math.max(0, Math.min(cells, Math.round((buyPressure / 100) * cells)));
  return green("█".repeat(buys)) + red("░".repeat(cells - buys)) + " " + dim(`${buyPressure.toFixed(0)}%`);
}
function pad(s: string, w: number, right = false): string {
  // pad by *visible* width (strip ANSI)
  const vis = s.replace(/\x1b\[[0-9;]*m/g, "");
  const gap = Math.max(0, w - vis.length);
  return right ? " ".repeat(gap) + s : s + " ".repeat(gap);
}
function clip(s: string, w: number): string {
  return s.length <= w ? s : s.slice(0, w - 1) + "…";
}

// ── arg parsing ──────────────────────────────────────────────────────────────
type Args = { dex: SolanaDex; limit: number; watch: number | null; json: boolean; sort: keyof SolanaPool };
function parseArgs(argv: string[]): Args {
  const a: Args = { dex: "all", limit: 15, watch: null, json: false, sort: "vol24" };
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--help" || t === "-h") { help(); process.exit(0); }
    else if (t === "--json") a.json = true;
    else if (t === "--watch" || t === "-w") a.watch = Number(argv[++i] ?? 15) || 15;
    else if (t === "--limit" || t === "-n") a.limit = Number(argv[++i] ?? 15) || 15;
    else if (t === "--sort") a.sort = (argv[++i] as keyof SolanaPool) ?? "vol24";
    else if (t.startsWith("-")) { console.error(red(`unknown flag: ${t}`)); process.exit(1); }
    else rest.push(t);
  }
  if (rest[0]) {
    if (rest[0] !== "all" && !(SOLANA_DEXES as readonly string[]).includes(rest[0])) {
      console.error(red(`unknown dex "${rest[0]}". options: all, ${SOLANA_DEXES.join(", ")}`));
      process.exit(1);
    }
    a.dex = rest[0] as SolanaDex;
  }
  return a;
}

function help() {
  console.log(`
${bold("formion-solana-data")} — live Solana DEX flow in your terminal ${dim("(no API key)")}

${bold("USAGE")}
  npx github:formionai/formion-solana-data [dex] [options]

${bold("DEX")}      all ${dim("(trending, default)")} · ${SOLANA_DEXES.join(" · ")}

${bold("OPTIONS")}
  -n, --limit <n>     rows to show (default 15)
  -w, --watch <sec>   refresh every <sec> seconds (default 15)
      --sort <field>  vol24 ${dim("(default)")} | liq | chg24 | buyPressure
      --json          raw JSON (pipe to jq)
  -h, --help          this help

${bold("EXAMPLES")}
  npx github:formionai/formion-solana-data
  npx github:formionai/formion-solana-data raydium --sort chg24
  npx github:formionai/formion-solana-data --watch 10 -n 25
  npx github:formionai/formion-solana-data --json | jq '.[0]'

${dim("Built by Formion — the AI trading terminal · https://formion.ai")}
`);
}

// ── render ───────────────────────────────────────────────────────────────────
function render(rows: SolanaPool[], a: Args) {
  const sorted = [...rows].sort((x, y) => (Number(y[a.sort] ?? -Infinity)) - (Number(x[a.sort] ?? -Infinity)));
  const top = sorted.slice(0, a.limit);

  const W = { pool: 20, dex: 14, price: 13, vol: 11, liq: 10, chg: 10, flow: 22 };
  const head =
    pad(bold("POOL"), W.pool) + pad(bold("DEX"), W.dex) +
    pad(bold("PRICE"), W.price, true) + "  " + pad(bold("24H VOL"), W.vol, true) + "  " +
    pad(bold("LIQ"), W.liq, true) + "  " + pad(bold("24H%"), W.chg, true) + "   " + bold("BUY/SELL FLOW");

  const label = a.dex === "all" ? "🔥 Trending Solana pools" : `Top ${a.dex} pools by 24h volume`;
  const now = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const lines: string[] = [];
  lines.push("");
  lines.push("  " + magenta(bold("◆ FORMION")) + dim("  ·  Solana DEX Flow  ·  ") + cyan(label));
  lines.push("  " + dim(now + "   data: GeckoTerminal (key-free)"));
  lines.push("  " + gray("─".repeat(96)));
  lines.push("  " + head);
  lines.push("  " + gray("─".repeat(96)));
  for (const p of top) {
    lines.push(
      "  " +
      pad(cyan(clip(p.pool || "?", W.pool - 1)), W.pool) +
      pad(dim(clip(p.dex, W.dex - 1)), W.dex) +
      pad(usd(p.priceUsd), W.price, true) + "  " +
      pad(bold(usd(p.vol24)), W.vol, true) + "  " +
      pad(usd(p.liq), W.liq, true) + "  " +
      pad(pct(p.chg24), W.chg, true) + "   " +
      flowBar(p.buyPressure)
    );
  }
  lines.push("  " + gray("─".repeat(96)));
  lines.push("  " + dim("Full multi-market terminal (CEX + DEX + AI signals) → ") + cyan("https://app.formion.ai/scan/solana-dex-flow"));
  lines.push("");
  return lines.join("\n");
}

// ── main ─────────────────────────────────────────────────────────────────────
async function once(a: Args) {
  const rows = await getSolanaFlow(a.dex);
  if (a.json) { console.log(JSON.stringify(rows.slice(0, a.limit), null, 2)); return; }
  const out = render(rows, a);
  if (a.watch !== null) process.stdout.write("\x1b[2J\x1b[H"); // clear screen in watch mode
  console.log(out);
  if (a.watch !== null) console.log("  " + dim(`↻ refreshing every ${a.watch}s — Ctrl-C to stop`));
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  try {
    await once(a);
    if (a.watch !== null) {
      const tick = () => once(a).catch((e) => console.error(red(String(e?.message ?? e))));
      setInterval(tick, a.watch * 1000);
    }
  } catch (e: any) {
    console.error(red(`\n  ✗ ${e?.message ?? e}\n  (GeckoTerminal public API rate-limits ~30 req/min — try again shortly)\n`));
    process.exit(1);
  }
}
main();
