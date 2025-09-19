// Service for Yahoo Finance API interactions.
//
// This module encapsulates logic related to fetching data from
// the yahoo-finance2 library. Keeping these functions separate makes
// it easier to mock them in tests and provides a single place to
// document request parameters and behaviour.

import yahooFinance from "yahoo-finance2";

/**
 * Get the price of a stock around a given quarter end date.
 *
 * The function looks up the price within a ±7 day window around
 * the provided date and returns the closing price from the day
 * closest to that date. If no price data is available the function
 * will return null and log a warning.
 *
 * @param symbol - The ticker symbol to fetch.
 * @param dt - The quarter end date. If null, no lookup is performed.
 * @returns The closing price or null if not found.
 */
export async function getQuarterEndPrice(
  symbol: string,
  dt: Date | null
): Promise<number | null> {
  if (!dt) return null;
  try {
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
    // Find the quote whose date is closest to the target date.
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

/**
 * Fetch quote summary information for a given ticker.
 *
 * The summary includes price, summaryProfile, defaultKeyStatistics
 * and earningsHistory modules. Encapsulating this call here allows
 * callers to avoid repeating the modules array.
 *
 * @param symbol - The ticker symbol to fetch.
 * @returns The full summary object from yahoo-finance2.
 */
export async function getQuoteSummary(symbol: string) {
  return yahooFinance.quoteSummary(symbol, {
    modules: [
      "price",
      "summaryProfile",
      "defaultKeyStatistics",
      "earningsHistory",
    ],
  });
}
