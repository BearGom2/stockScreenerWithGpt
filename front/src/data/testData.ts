import type { TickerRow } from "../components/USStockSectorScreener";

// ===== 목데이터 =====
export const TESTDATA: TickerRow[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Information Technology",
    periodicity: "quarterly",
    snapshots: [
      { period: "2025Q2", eps: 1.40, price: 225 },
      { period: "2025Q1", eps: 1.32, price: 205 },
      { period: "2024Q4", eps: 1.26, price: 190 },
      { period: "2024Q3", eps: 1.20, price: 180 },
    ],
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    sector: "Information Technology",
    periodicity: "quarterly",
    snapshots: [
      { period: "2025Q2", eps: 3.05, price: 455 },
      { period: "2025Q1", eps: 2.95, price: 420 },
      { period: "2024Q4", eps: 2.85, price: 410 },
      { period: "2024Q3", eps: 2.70, price: 390 },
    ],
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    sector: "Consumer Discretionary",
    periodicity: "quarterly",
    snapshots: [
      { period: "2025Q2", eps: 0.90, price: 205 },
      { period: "2025Q1", eps: 0.84, price: 190 },
      { period: "2024Q4", eps: 0.78, price: 175 },
      { period: "2024Q3", eps: 0.60, price: 150 },
    ],
  },
  {
    symbol: "UNH",
    name: "UnitedHealth Group",
    sector: "Health Care",
    periodicity: "quarterly",
    snapshots: [
      { period: "2025Q2", eps: 7.00, price: 570 },
      { period: "2025Q1", eps: 6.60, price: 540 },
      { period: "2024Q4", eps: 6.30, price: 520 },
      { period: "2024Q3", eps: 6.10, price: 510 },
    ],
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    sector: "Financials",
    periodicity: "quarterly",
    snapshots: [
      { period: "2025Q2", eps: 4.25, price: 215 },
      { period: "2025Q1", eps: 4.10, price: 200 },
      { period: "2024Q4", eps: 3.90, price: 190 },
      { period: "2024Q3", eps: 3.70, price: 185 },
    ],
  },
  {
    symbol: "CAT",
    name: "Caterpillar Inc.",
    sector: "Industrials",
    periodicity: "quarterly",
    snapshots: [
      { period: "2025Q2", eps: 6.00, price: 345 },
      { period: "2025Q1", eps: 5.80, price: 330 },
      { period: "2024Q4", eps: 5.50, price: 310 },
      { period: "2024Q3", eps: 5.10, price: 290 },
    ],
  },
  // 연간 데이터 예시
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Information Technology",
    periodicity: "annual",
    snapshots: [
      { period: "2025", eps: 5.50, price: 225 },
      { period: "2024", eps: 5.10, price: 190 },
      { period: "2023", eps: 5.00, price: 180 },
    ],
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    sector: "Information Technology",
    periodicity: "annual",
    snapshots: [
      { period: "2025", eps: 11.80, price: 455 },
      { period: "2024", eps: 10.60, price: 410 },
      { period: "2023", eps: 9.30, price: 345 },
    ],
  },
];
