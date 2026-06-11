import { getSolanaFlow } from "./index.ts";

// Trending Solana pools — volume, liquidity, buy/sell pressure.
const rows = await getSolanaFlow();
for (const r of rows.slice(0, 10)) {
  const chg = (r.chg24 ?? 0) >= 0 ? `+${r.chg24?.toFixed(1)}%` : `${r.chg24?.toFixed(1)}%`;
  console.log(
    `${r.base}/${r.quote}`.padEnd(20),
    r.dex.padEnd(12),
    `$${Math.round(r.vol24 ?? 0).toLocaleString()}`.padEnd(14),
    chg.padEnd(8),
    `buy ${r.buyPressure.toFixed(0)}%`,
  );
}
