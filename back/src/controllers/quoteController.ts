import { Request, Response } from "express";
import { getQuoteSummary, getQuarterEndPrice } from "../services/yahoo";

/**
 * Handler for GET /api/quote/:symbol
 *
 * Returns summary information for a single ticker, including a list
 * of snapshot objects. Each snapshot contains the EPS, price and PER
 * computed at each reporting period. If any snapshot is missing an
 * EPS value it is filtered out. Snapshots are returned in
 * chronological order.
 */
export async function getQuote(req: Request, res: Response) {
  try {
    const { symbol } = req.params;
    const data = await getQuoteSummary(symbol);
    const price = data.price?.regularMarketPrice ?? null;
    const history = data.earningsHistory?.history ?? [];
    const snapshots = await Promise.all(
      history.map(async (h) => {
        const dt = h.quarter ? new Date(h.quarter) : null;
        const year = dt?.getFullYear();
        const qLabel = h.period;
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
}