// Centralised type declarations for the front‑end models.
//
// This module defines all common types used throughout the front‑end,
// including enums for sectors and periodicity as well as the core data
// structures.  Centralising these definitions improves maintainability and
// avoids duplication of type definitions across components and utilities.

/**
 * A readonly list of sector names used by the S&P 500 screener.
 * Using a tuple type here allows TypeScript to infer a union of the
 * literal strings, which can be reused for the `Sector` type below.
 */
export const SECTORS = [
  "Conglomerates",
  "Specialty Industrial Machinery",
  "Medical Devices",
  "Drug Manufacturers - General",
  "Information Technology Services",
  "Software - Application",
  "Semiconductors",
  "Utilities - Diversified",
  "Insurance - Life",
  "Diagnostics & Research",
  "Specialty Chemicals",
  "Travel Services",
  "Software - Infrastructure",
  "REIT - Office",
  "Medical Instruments & Supplies",
  "Security & Protection Services",
  "Utilities - Regulated Electric",
  "Insurance - Property & Casualty",
  "Internet Content & Information",
  "Tobacco",
  "Internet Retail",
  "Packaging & Containers",
  "Credit Services",
  "Insurance - Diversified",
  "REIT - Specialty",
  "Utilities - Regulated Water",
  "Asset Management",
  "Electronic Components",
  "Insurance Brokers",
  "Oil & Gas E&P",
  "Consumer Electronics",
  "Semiconductor Equipment & Materials",
  "Auto Parts",
  "Farm Products",
  "Computer Hardware",
  "Telecom Services",
  "Utilities - Regulated Gas",
  "REIT - Residential",
  "Aerospace & Defense",
  "Oil & Gas Equipment & Services",
  "Banks - Diversified",
  "Specialty Retail",
  "Biotechnology",
  "Beverages - Wineries & Distilleries",
  "Building Products & Equipment",
  "Integrated Freight & Logistics",
  "Resorts & Casinos",
  "Packaged Foods",
  "Medical Distribution",
  "Auto & Truck Dealerships",
  "Farm & Heavy Construction Machinery",
  "Financial Data & Stock Exchanges",
  "Real Estate Services",
  "Healthcare Plans",
  "Agricultural Inputs",
  "Capital Markets",
  "Oil & Gas Integrated",
  "Restaurants",
  "Household & Personal Products",
  "Specialty Business Services",
  "Communication Equipment",
  "Banks - Regional",
  "Beverages - Non-Alcoholic",
  "Beverages - Brewers",
  "Utilities - Renewable",
  "Discount Stores",
  "Railroads",
  "Medical Care Facilities",
  "Footwear & Accessories",
  "Airlines",
  "Chemicals",
  "Residential Construction",
  "Electronic Gaming & Multimedia",
  "Solar",
  "Consulting Services",
  "Insurance - Reinsurance",
  "REIT - Industrial",
  "Industrial Distribution",
  "REIT - Retail",
  "Auto Manufacturers",
  "Scientific & Technical Instruments",
  "Entertainment",
  "Copper",
  "Health Information Services",
  "Leisure",
  "REIT - Healthcare Facilities",
  "Confectioners",
  "Lodging",
  "Home Improvement Retail",
  "REIT - Hotel & Motel",
  "Electrical Equipment & Parts",
  "Advertising Agencies",
  "Engineering & Construction",
  "Oil & Gas Midstream",
  "Grocery Stores",
  "Apparel Retail",
  "Oil & Gas Refining & Marketing",
  "Building Materials",
  "Furnishings, Fixtures & Appliances",
  "Gold",
  "Utilities - Independent Power Producers",
  "Steel",
  "Trucking",
  "Apparel Manufacturing",
  "Waste Management",
  "Personal Services",
  "Tools & Accessories",
  "Food Distribution",
  "Luxury Goods",
  "Rental & Leasing Services",
  "Pollution & Treatment Controls",
  "Drug Manufacturers - Specialty & Generic",
  "REIT - Diversified",
] as const;

/** Union type of all valid sector names. */
export type Sector = (typeof SECTORS)[number];

/**
 * Represents the frequency at which snapshots are recorded.
 * At present we support only quarterly and annual snapshots.
 */
export type Periodicity = "quarterly" | "annual";

/**
 * A single time‑series data point for a ticker.  In addition to the
 * mandatory EPS and price fields, optional fields are provided for
 * revenue, return on equity (ROE) and debt‑equity ratio.  The `per`
 * value is computed on the front‑end and may be undefined if EPS is
 * non‑positive.
 */
export interface FundamentalsSnapshot {
  /** Period identifier in the form "YYYY-QN". */
  period: string;
  /** Earnings per share for the period. */
  eps: number;
  /** Stock price corresponding to the period. */
  price: number;
  /** Price‑earnings ratio (price / EPS), optional if EPS ≤ 0. */
  per?: number;
  /** Company revenue for the period, optional. */
  revenue?: number;
  /** Return on equity expressed as a fraction (e.g. 0.15 for 15%), optional. */
  roe?: number;
  /** Debt‑to‑equity ratio, optional. */
  debtEquity?: number;
}

/**
 * A row in the screener table representing a single stock ticker.
 * Contains metadata and a list of fundamentals snapshots ordered from
 * most recent to oldest.
 */
export interface TickerRow {
  symbol: string;
  name: string;
  sector: Sector;
  periodicity: Periodicity;
  snapshots: FundamentalsSnapshot[];
}

/**
 * Sector filter type used in the UI.  "all" selects all sectors while
 * any specific sector filters the list to that value.
 */
export type SectorFilter = Sector | "all";
