import express from "express";
import cors from "cors";
import yahooFinance from "yahoo-finance2";
import fs from "fs";

const app = express();
app.use(cors());

const sp500Tickers: string[] = JSON.parse(
  fs.readFileSync("./sp500.json", "utf-8")
);

async function getQuarterEndPrice(
  symbol: string,
  dt: Date | null
): Promise<number | null> {
  if (!dt) return null;

  try {
    // 분기 말일 기준 ±7일 범위 조회
    const start = new Date(dt);
    start.setDate(start.getDate() - 7);

    const end = new Date(dt);
    end.setDate(end.getDate() + 7);

    const history = await yahooFinance.chart(symbol, {
      period1: start,
      period2: end,
      interval: "1d",
    });

    if (!history.quotes || history.quotes.length === 0) {
      console.warn(`⚠️ No price history for ${symbol} around ${dt}`);
      return null;
    }

    // 가장 가까운 날짜 찾기
    let closest = history.quotes[0];
    let minDiff = Math.abs(new Date(closest.date).getTime() - dt.getTime());

    for (const q of history.quotes) {
      const diff = Math.abs(new Date(q.date).getTime() - dt.getTime());
      if (diff < minDiff) {
        closest = q;
        minDiff = diff;
      }
    }

    return closest.close ?? null;
  } catch (err) {
    console.error(`❌ Failed to fetch price for ${symbol} at ${dt}`, err);
    return null;
  }
}

// 단일 종목 조회
app.get("/api/quote/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await yahooFinance.quoteSummary(symbol, {
      modules: [
        "price",
        "summaryProfile",
        "defaultKeyStatistics",
        "earningsHistory",
      ],
    });

    const price = data.price?.regularMarketPrice ?? null;
    const history = data.earningsHistory?.history ?? [];

    const snapshots = await Promise.all(
      history.map(async (h) => {
        const dt = h.quarter ? new Date(h.quarter) : null;
        const year = dt?.getFullYear();
        const qLabel = h.period; // "2023-12-31" 같은 값

        const qPrice = await getQuarterEndPrice(symbol, dt);

        return {
          period: year ? `${year}-${qLabel}` : qLabel,
          eps: h.epsActual ?? null,
          price: qPrice ?? price,
          per: h.epsActual && qPrice ? qPrice / h.epsActual : null,
        };
      })
    );

    res.json({
      symbol,
      name: data.price?.shortName ?? symbol,
      sector: data.summaryProfile?.sector ?? "Unknown",
      price,
      eps: data.defaultKeyStatistics?.trailingEps ?? null,
      per:
        price && data.defaultKeyStatistics?.trailingEps
          ? price / data.defaultKeyStatistics.trailingEps
          : null,
      snapshots: snapshots
        .filter((s) => s.eps !== null)
        .sort((a, b) => (a.period > b.period ? 1 : -1)),
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
// 전체 S&P500 요약 데이터 (분기별 snapshots 포함)
app.get("/api/sp500-data", async (_req, res) => {
  try {
    const results = await Promise.all(
      sp500Tickers.slice(0, 50).map(async (symbol) => {
        try {
          const d = await yahooFinance.quoteSummary(symbol, {
            modules: [
              "price",
              "defaultKeyStatistics",
              "summaryProfile",
              "earningsHistory",
            ],
          });

          const price = d.price?.regularMarketPrice ?? null;
          const history = d.earningsHistory?.history ?? [];

          // 분기별 snapshot 변환
          const snapshots = await Promise.all(
            history.map(async (h) => {
              const dt = h.quarter ? new Date(h.quarter) : null;
              const year = dt?.getFullYear();
              const q = dt ? Math.floor(dt.getMonth() / 3) + 1 : null;

              const qPrice = await getQuarterEndPrice(symbol, dt);

              return {
                period: year && q ? `${year}-Q${q}` : h.period,
                eps: h.epsActual ?? null,
                price: qPrice ?? price,
                per: h.epsActual && qPrice ? qPrice / h.epsActual : null,
              };
            })
          );

          return {
            symbol,
            name: d.price?.shortName ?? symbol,
            sector: d.summaryProfile?.sector ?? "Unknown",
            price,
            eps: d.defaultKeyStatistics?.trailingEps ?? null,
            per:
              price && d.defaultKeyStatistics?.trailingEps
                ? price / d.defaultKeyStatistics.trailingEps
                : null,
            snapshots: snapshots
              .filter((s) => s.eps !== null)
              .sort((a, b) => {
                // 안전한 정렬: YYYY*10 + Q 값으로 비교
                const [ay, aq] = a.period.split("-Q").map(Number);
                const [by, bq] = b.period.split("-Q").map(Number);
                return ay === by ? aq - bq : ay - by;
              }),
          };
        } catch (err) {
          console.error("Skip", symbol, err);
          return null;
        }
      })
    );

    res.json(results.filter(Boolean));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
