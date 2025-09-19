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
  const res = await fetch("http://127.0.0.1:4000/api/sp500-data");
  if (!res.ok) {
    throw new Error(`Failed to fetch S&P500 data: ${res.statusText}`);
  }
  const json = (await res.json()) as ApiTicker[];
  console.log(json);
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
  const res = await fetch(
    `http://127.0.0.1:4000/api/quote/${encodeURIComponent(symbol)}`
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch ticker ${symbol}: ${res.status} ${res.statusText}`
    );
  }
  const json = await res.json();
  // The backend returns a single ticker object; wrap in an array and take the first element.
  return adaptApiData([json])[0];
}
