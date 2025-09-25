// API helper functions for fetching data from the backend.
//
// These functions wrap the browser Fetch API and convert the raw JSON
// responses into the internal `TickerRow` structures used by the UI.
// Centralising API calls here simplifies error handling and makes it
// easier to mock fetch calls in unit tests.

import { adaptApiData, type ApiTicker } from "./adapter";
import type { TickerRow } from "../types";

/**
 * Fetch the S&P 500 fundamentals data from the backend.  Returns an array
 * of `TickerRow` objects after adaptation.  If the request fails the
 * function will throw an error to be handled by the caller.
 */
export async function fetchSP500Data(): Promise<TickerRow[]> {
  // Try to read from localStorage to avoid unnecessary network requests.  The
  // cached object stores the raw API data along with a timestamp.  If the
  // cache is fresh (less than one hour old) we adapt it directly and return.
  try {
    const cached = localStorage.getItem("sp500-data-cache");
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (typeof timestamp === "number" && Array.isArray(data)) {
        // 1 hour = 60 * 60 * 1000 ms
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          return adaptApiData(data as ApiTicker[]);
        }
      }
    }
  } catch {
    // Ignore caching errors (e.g. localStorage unavailable in SSR).
  }
  // No usable cache; fetch from the backend.
  const res = await fetch("http://127.0.0.1:4000/api/sp500-data");
  if (!res.ok) {
    throw new Error(`Failed to fetch S&P500 data: ${res.statusText}`);
  }
  const json = (await res.json()) as ApiTicker[];
  // Store raw API data with a timestamp for future reuse.
  try {
    localStorage.setItem(
      "sp500-data-cache",
      JSON.stringify({ timestamp: Date.now(), data: json })
    );
  } catch {
    // Ignore storage errors (e.g. quota exceeded).
  }
  return adaptApiData(json);
}

/**
 * Fetch fundamentals data for a single ticker from the backend.  Returns
 * a `TickerRow` object after adaptation.  If the request fails the
 * function will throw an error.
 *
 * @param symbol The ticker symbol to fetch.
 */
export async function fetchTicker(symbol: string): Promise<TickerRow> {
  const cacheKey = `ticker-${symbol}-cache`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (typeof timestamp === "number" && data) {
        // Reuse ticker cache for up to 10 minutes.
        if (Date.now() - timestamp < 10 * 60 * 1000) {
          return adaptApiData([data])[0];
        }
      }
    }
  } catch {
    // Ignore caching errors.
  }
  const res = await fetch(
    `http://127.0.0.1:4000/api/quote/${encodeURIComponent(symbol)}`
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch ticker ${symbol}: ${res.status} ${res.statusText}`
    );
  }
  const json = await res.json();
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ timestamp: Date.now(), data: json })
    );
  } catch {
    // Ignore storage errors.
  }
  return adaptApiData([json])[0];
}
