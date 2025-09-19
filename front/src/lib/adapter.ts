import {
  SECTORS,
  type FundamentalsSnapshot,
  type Sector,
  type Periodicity,
  type TickerRow,
} from "../types";

/**
 * API response schema definitions.  These types mirror the structure
 * returned by the backend endpoints and are used for adapting the raw
 * payload into our internal `TickerRow` model.  Note that numeric fields
 * may be `null` when the API fails to provide data.
 */
/** Shape of the backend snapshot objects.
 *  Extra fundamentals may be included by the API and will be
 *  propagated into the client model when present.
 */
interface ApiSnapshot {
  period: string;
  eps: number | null;
  price: number | null;
  per: number | null;
  revenue?: number | null;
  roe?: number | null;
  debtEquity?: number | null;
}

/** Shape of the backend ticker objects returned from the API. */
export interface ApiTicker {
  symbol: string;
  name: string;
  sector: string;
  price: number | null;
  eps: number | null;
  per: number | null;
  snapshots: ApiSnapshot[];
}

/**
 * Convert a raw sector string into the internal `Sector` union.  Unknown
 * values default to the first sector in the `SECTORS` array.  Because
 * `SECTORS` is a readonly tuple, the cast to `Sector` is safe.
 */
function normalizeSector(sec: string): Sector {
  return (SECTORS.find((s) => s === sec) as Sector) ?? SECTORS[0];
}

/**
 * Parse a period string into year and quarter components.  Supports values
 * like "2025-2q" or "2025 2Q".  Missing values return zeros to ensure
 * deterministic sorting.
 */
function parsePeriod(period: string): { year: number; quarter: number } {
  const match = period.match(/(\d{4}).*?(\d)q/i);
  if (match) {
    return { year: parseInt(match[1], 10), quarter: parseInt(match[2], 10) };
  }
  return { year: 0, quarter: 0 };
}

/**
 * Adapt an array of API tickers into our internal `TickerRow` structure.
 * Each snapshot is cleaned up: null values are replaced with zero or
 * undefined and periods are normalised to a consistent format (e.g.
 * "2024-4Q").  Snapshots are sorted chronologically and then reversed so
 * that the most recent snapshot appears first.
 */
export function adaptApiData(apiData: ApiTicker[]): TickerRow[] {
  return apiData.map((d) => {
    const snapshots: FundamentalsSnapshot[] = (d.snapshots ?? [])
      // Remove snapshots with null EPS – we cannot compute PER from them.
      .filter((s) => s.eps !== null)
      // Convert to our internal snapshot format.
      .map((s) => ({
        period: s.period.replace(/\s+/g, "").replace("-", ""),
        eps: s.eps ?? 0,
        price: s.price ?? 0,
        per: s.per ?? undefined,
        revenue: s.revenue ?? undefined,
        roe: s.roe ?? undefined,
        debtEquity: s.debtEquity ?? undefined,
      }))
      // Sort chronologically ascending (oldest first) based on year and quarter.
      .sort((a, b) => {
        const pa = parsePeriod(a.period);
        const pb = parsePeriod(b.period);
        if (pa.year !== pb.year) return pa.year - pb.year;
        return pa.quarter - pb.quarter;
      })
      // Reverse to get most recent first and normalise period formatting.
      .reverse()
      .map((s) => {
        const qIdx = s.period.toLowerCase().indexOf("q");
        return {
          period: `${s.period.slice(0, qIdx)}-${s.period.slice(qIdx)}`,
          eps: s.eps,
          price: s.price,
          per: s.per,
          revenue: s.revenue,
          roe: s.roe,
          debtEquity: s.debtEquity,
        } as FundamentalsSnapshot;
      });
    return {
      symbol: d.symbol,
      name: d.name,
      sector: normalizeSector(d.sector),
      periodicity: "quarterly" as Periodicity,
      snapshots,
    } as TickerRow;
  });
}
