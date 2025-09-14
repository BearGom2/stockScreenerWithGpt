export type Periodicity = "quarterly" | "annual";
export type Sector =
  | "Industrials"
  | "Healthcare"
  | "Technology"
  | "Utilities"
  | "Financial Services"
  | "Basic Materials"
  | "Consumer Cyclical"
  | "Real Estate"
  | "Communication Services"
  | "Consumer Defensive"
  | "Energy";

export interface FundamentalsSnapshot {
  period: string;
  eps: number;
  price: number;
  per?: number;
  revenue?: number;
  roe?: number;
  debtEquity?: number;
}

export interface TickerRow {
  symbol: string;
  name: string;
  sector: Sector;
  periodicity: Periodicity;
  snapshots: FundamentalsSnapshot[]; // 최신순
}

// --- utils ---
export function calcPER(eps: number, price: number): number | undefined {
  if (eps <= 0) return undefined;
  return price / eps;
}

export function enrichWithPER(rows: TickerRow[]): TickerRow[] {
  return rows.map((r) => ({
    ...r,
    snapshots: r.snapshots.map((s) => ({ ...s, per: calcPER(s.eps, s.price) })),
  }));
}

export function latestSnapshot(row: TickerRow) {
  return row.snapshots[0];
}

export function pctChange(a: number, b: number) {
  if (b === 0) return undefined;
  return (a - b) / b;
}

export function byPeriodicity(rows: TickerRow[], p: Periodicity) {
  return rows.filter((r) => r.periodicity === p);
}

export function groupBySector(rows: TickerRow[]) {
  return rows.reduce<Record<string, TickerRow[]>>((acc, r) => {
    (acc[r.sector] ||= []).push(r);
    return acc;
  }, {});
}

export function aggregateSectorPER(rows: TickerRow[]) {
  const groups = groupBySector(rows);
  return Object.entries(groups).map(([sector, arr]) => {
    const pers = arr.map((r) => latestSnapshot(r).per).filter((x): x is number => typeof x === "number");
    const avg = pers.length ? pers.reduce((a, b) => a + b, 0) / pers.length : undefined;
    const sorted = [...pers].sort((a, b) => a - b);
    const low = sorted[0];
    const high = sorted[sorted.length - 1];
    return { sector, avgPER: avg, lowPER: low, highPER: high, count: arr.length };
  });
}

export function risingSectors(rows: TickerRow[]) {
  const groups = groupBySector(rows);
  return Object.entries(groups).map(([sector, arr]) => {
    const changes = arr
      .map((r) => pctChange(r.snapshots[0].price, r.snapshots[1]?.price ?? r.snapshots[0].price))
      .filter((x): x is number => typeof x === "number");
    const avgRise = changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
    return { sector, avgRise };
  });
}

export function risingTickers(rows: TickerRow[]) {
  return rows
    .map((r) => ({
      symbol: r.symbol,
      name: r.name,
      sector: r.sector,
      rise: pctChange(r.snapshots[0].price, r.snapshots[1]?.price ?? r.snapshots[0].price) ?? 0,
      latest: r.snapshots[0],
      prev: r.snapshots[1] ?? r.snapshots[0],
    }))
    .sort((a, b) => b.rise - a.rise);
}

export function findRiseStartIndex(row: TickerRow): number {
  for (let i = 0; i < row.snapshots.length - 1; i++) {
    const now = row.snapshots[i];
    const prev = row.snapshots[i + 1];
    if (now.price > prev.price) return i + 1;
  }
  return row.snapshots.length - 1;
}
