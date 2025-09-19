import { Request, Response } from "express";
import fs from "fs";
import { getQuoteSummary, getQuarterEndPrice } from "../services/yahoo";

// Load the S&P500 tickers from the JSON file once when the module is loaded.
// Using require.resolve ensures the path is resolved relative to this file
// regardless of the working directory when the server is run.
const sp500Tickers: string[] = JSON.parse(
  fs.readFileSync(require.resolve("../../sp500.json"), "utf-8")
);

/**
 * Handler for GET /api/sp500-data
 *
 * Returns summary information for each ticker (currently limited to the
 * first 50 tickers for performance). For each ticker, computes a list
 * of snapshot objects containing EPS, price and PER per period. Snapshots
 * are filtered to remove entries with missing EPS values and sorted
 * chronologically by year and quarter.
 */
export async function getSP500Data(_req: Request, res: Response) {
  try {
    const results = await Promise.all(
      sp500Tickers.map(async (symbol) => {
        try {
          const d = await getQuoteSummary(symbol);

          const price = d.price?.regularMarketPrice ?? null;
          const history = d.earningsHistory?.history ?? [];
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
}
