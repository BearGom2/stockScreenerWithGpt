import {
  type FundamentalsSnapshot,
  type Periodicity,
  type Sector,
  type TickerRow,
} from "../types";

/**
 * This module contains pure functions operating on the front‑end `TickerRow`
 * model.  The underlying types live in src/types.ts; no type definitions
 * should be duplicated here.  Utilities such as P/E ratio calculation,
 * snapshot selection and sector aggregation are provided to simplify the
 * UI logic in components.
 */

/**
 * Compute the price‑earnings ratio given EPS and price.  Returns `undefined`
 * when EPS is non‑positive so that upstream code can handle missing or
 * meaningless values gracefully.
 */
export function calcPER(eps: number, price: number): number | undefined {
  if (eps <= 0) return undefined;
  return price / eps;
}

/**
 * For each row, recompute PER for all snapshots.  The API may not supply
 * a precomputed PER; we derive it here using the `calcPER` helper.
 */
export function enrichWithPER(rows: TickerRow[]): TickerRow[] {
  return rows.map((r) => ({
    ...r,
    snapshots: r.snapshots.map((s) => ({
      ...s,
      per: calcPER(s.eps, s.price),
    })),
  }));
}

/**
 * Return the most recent snapshot from a row.  Assumes snapshots are sorted
 * in descending order by period.
 */
export function latestSnapshot(row: TickerRow): FundamentalsSnapshot {
  return row.snapshots[0];
}

/**
 * Compute percent change between two numbers.  If the baseline is zero,
 * return undefined to avoid divide‑by‑zero.
 */
export function pctChange(a: number, b: number): number | undefined {
  if (b === 0) return undefined;
  return (a - b) / b;
}

/**
 * Filter rows by periodicity.
 */
export function byPeriodicity(rows: TickerRow[], p: Periodicity): TickerRow[] {
  return rows.filter((r) => r.periodicity === p);
}

/**
 * Group rows by their sector.
 */
export function groupBySector(rows: TickerRow[]): Record<Sector, TickerRow[]> {
  return rows.reduce<Record<Sector, TickerRow[]>>((acc, r) => {
    (acc[r.sector] ||= []).push(r);
    return acc;
  }, {} as Record<Sector, TickerRow[]>);
}

/**
 * Aggregate PER statistics per sector.  Computes the average, lowest and
 * highest PER among the latest snapshots in each sector.  Rows with
 * undefined PER are ignored in the calculation.
 */
export function aggregateSectorPER(rows: TickerRow[]) {
  const groups = groupBySector(rows);
  return Object.entries(groups).map(([sector, arr]) => {
    const pers = arr
      .map((r) => latestSnapshot(r)?.per)
      .filter((x): x is number => typeof x === "number");
    const avg =
      pers.length > 0
        ? pers.reduce((a, b) => a + b, 0) / pers.length
        : undefined;
    const sorted = [...pers].sort((a, b) => a - b);
    const low = sorted[0];
    const high = sorted[sorted.length - 1];
    return {
      sector: sector as Sector,
      avgPER: avg,
      lowPER: low,
      highPER: high,
      count: arr.length,
    };
  });
}

/**
 * Compute average price rise for each sector between the latest two snapshots.
 * Returns an array of objects with sector and avgRise.  Sectors with no
 * available comparison (less than two snapshots) will have an average of 0.
 */
export function risingSectors(rows: TickerRow[]) {
  const groups = groupBySector(rows);
  return Object.entries(groups).map(([sector, arr]) => {
    const changes = arr
      .map((r) =>
        pctChange(
          r.snapshots[0]?.price,
          r.snapshots[1]?.price ?? r.snapshots[0]?.price
        )
      )
      .filter((x): x is number => typeof x === "number");
    const avgRise =
      changes.length > 0
        ? changes.reduce((a, b) => a + b, 0) / changes.length
        : 0;
    return { sector: sector as Sector, avgRise };
  });
}

/**
 * Rank tickers by their most recent price change.  Returns an array sorted
 * descending by rise, along with a copy of the latest and previous snapshot
 * for convenience.
 */
export function risingTickers(rows: TickerRow[]) {
  return rows
    .map((r) => {
      const latest = r.snapshots[0];
      const prev = r.snapshots[1] ?? latest;
      return {
        symbol: r.symbol,
        name: r.name,
        sector: r.sector,
        rise: pctChange(latest?.price, prev?.price) ?? 0,
        latest,
        prev,
      };
    })
    .sort((a, b) => b.rise - a.rise);
}

/**
 * Find the index in the snapshots array where a price rise first started.
 * Returns the index of the snapshot prior to the first rise; if no rise is
 * detected the last index is returned.
 */
export function findRiseStartIndex(row: TickerRow): number {
  for (let i = 0; i < row.snapshots.length - 1; i++) {
    const now = row.snapshots[i];
    const prev = row.snapshots[i + 1];
    if (now.price > prev.price) return i + 1;
  }
  return row.snapshots.length - 1;
}
