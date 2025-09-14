import type {
  FundamentalsSnapshot,
  Periodicity,
  Sector,
  TickerRow,
} from "./stocks";

// API 응답 타입 정의
interface ApiSnapshot {
  period: string;
  eps: number | null;
  price: number | null;
  per: number | null;
}

export interface ApiTicker {
  symbol: string;
  name: string;
  sector: string;
  price: number | null;
  eps: number | null;
  per: number | null;
  snapshots: ApiSnapshot[];
}

// 섹터 문자열을 우리 `Sector` 타입으로 안전하게 매핑
function normalizeSector(sec: string): Sector {
  const sectors: Sector[] = [
    "Industrials",
    "Healthcare",
    "Technology",
    "Utilities",
    "Financial Services",
    "Basic Materials",
    "Consumer Cyclical",
    "Real Estate",
    "Communication Services",
    "Consumer Defensive",
    "Energy",
  ];
  return (sectors.find((s) => s === sec) as Sector) ?? "Industrials";
}

function parsePeriod(period: string) {
  // "2025 -2q" → { year: 2025, quarter: 2 }
  const match = period.match(/(\d{4}).*?(\d)q/i);
  if (match) {
    return { year: parseInt(match[1], 10), quarter: parseInt(match[2], 10) };
  }
  return { year: 0, quarter: 0 };
}

export function adaptApiData(apiData: ApiTicker[]): TickerRow[] {
  return apiData.map((d) => ({
    symbol: d.symbol,
    name: d.name,
    sector: normalizeSector(d.sector),
    periodicity: "quarterly" as Periodicity,
    snapshots: (d.snapshots ?? [])
      .filter((s) => s.eps !== null)
      .map(
        (s): FundamentalsSnapshot => ({
          period: s.period.replace(/\s+/g, "").replace("-", ""), // 문자열 정리
          eps: s.eps ?? 0,
          price: s.price ?? 0,
          per: s.per ?? undefined,
        })
      )
      .sort((a: FundamentalsSnapshot, b: FundamentalsSnapshot) => {
        const pa = parsePeriod(a.period);
        const pb = parsePeriod(b.period);
        if (pa.year !== pb.year) return pa.year - pb.year;
        return pa.quarter - pb.quarter;
      })
      .reverse()
      .map(
        (s): FundamentalsSnapshot => ({
          period:
            s.period.slice(0, s.period.indexOf("q") - 1) +
            "-" +
            s.period.slice(s.period.indexOf("q") - 1),
          eps: s.eps ?? 0,
          price: s.price ?? 0,
          per: s.per ?? undefined,
        })
      ), // 최신순 정렬 (Q4 → Q3 → Q2 …)
  }));
}
