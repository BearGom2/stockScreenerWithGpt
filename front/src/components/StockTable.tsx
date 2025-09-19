import { useState } from "react";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { TickerRow } from "../types";
import { latestSnapshot } from "../lib/stocks";

interface StockTableProps {
  rows: TickerRow[];
}

/**
 * Displays a paginated, sortable table of ticker rows.  Sorting is client
 * side only and toggles between ascending and descending for numeric and
 * string fields.  Pagination is fixed at 10 rows per page to avoid large
 * tables overwhelming the UI.
 */
export default function StockTable({ rows }: StockTableProps) {
  const [sortKey, setSortKey] = useState<
    "symbol" | "per" | "eps" | "price" | "rise"
  >("rise");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const sorted = [...rows].sort((a, b) => {
    const latestA = latestSnapshot(a);
    const latestB = latestSnapshot(b);

    let valA: number | string = "";
    let valB: number | string = "";

    switch (sortKey) {
      case "symbol":
        valA = a.symbol;
        valB = b.symbol;
        break;
      case "per":
        valA = latestA.per ?? 0;
        valB = latestB.per ?? 0;
        break;
      case "eps":
        valA = latestA.eps;
        valB = latestB.eps;
        break;
      case "price":
        valA = latestA.price;
        valB = latestB.price;
        break;
      case "rise":
        valA = latestA.price - (a.snapshots[1]?.price ?? latestA.price);
        valB = latestB.price - (b.snapshots[1]?.price ?? latestB.price);
        break;
    }

    if (typeof valA === "string" && typeof valB === "string") {
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortOrder === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    }
  });

  const paged = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  function handleSort(key: typeof sortKey) {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2 cursor-pointer" onClick={() => handleSort("symbol")}>
                  종목
                </th>
                <th className="p-2 cursor-pointer" onClick={() => handleSort("per")}>PER</th>
                <th className="p-2 cursor-pointer" onClick={() => handleSort("eps")}>EPS</th>
                <th className="p-2 cursor-pointer" onClick={() => handleSort("price")}>
                  가격
                </th>
                <th className="p-2 cursor-pointer" onClick={() => handleSort("rise")}>
                  상승률
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => {
                const latest = latestSnapshot(row);
                const prev = row.snapshots[1] ?? latest;
                const rise = prev ? (latest.price - prev.price) / prev.price : 0;
                return (
                  <tr key={row.symbol} className="border-b hover:bg-muted/40">
                    <td className="p-2">
                      {row.name} <span className="text-muted-foreground">({row.symbol})</span>
                    </td>
                    <td className="p-2">{latest.per?.toFixed(2) ?? "-"}</td>
                    <td className="p-2">{latest.eps.toFixed(2)}</td>
                    <td className="p-2">{latest.price.toFixed(2)}</td>
                    <td className="p-2">
                      <Badge
                        variant={rise >= 0 ? "default" : "destructive"}
                        className="gap-1"
                      >
                        {rise >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {(rise * 100).toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            이전
          </button>
          <span>Page {page}</span>
          <button
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            disabled={page * rowsPerPage >= rows.length}
            onClick={() => setPage(page + 1)}
          >
            다음
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
