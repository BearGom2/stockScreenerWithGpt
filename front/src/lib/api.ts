import type { ApiTicker } from "./adapter";

const API_BASE = "http://localhost:4000/api";

export async function fetchTickerData(
  symbol: string
): Promise<ApiTicker | null> {
  try {
    const res = await fetch(`${API_BASE}/quote/${symbol}`);
    if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("fetchTickerData error", e);
    return null;
  }
}

export async function fetchSP500Data(): Promise<ApiTicker[]> {
  try {
    const res = await fetch(`${API_BASE}/sp500-data`);
    if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("fetchSP500Data error", e);
    return [];
  }
}
