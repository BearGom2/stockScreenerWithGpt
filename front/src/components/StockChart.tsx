import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { TickerRow } from "../lib/stocks";

export default function StockChart({ row }: { row: TickerRow }) {
  const data = row.snapshots
    .map((s) => ({
      period: s.period,
      price: s.price,
      eps: s.eps,
      per: s.per,
    }))
    .reverse(); // 오래된 → 최신 순

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis
            yAxisId="left"
            label={{ value: "Price", angle: -90, position: "insideLeft" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: "EPS", angle: 90, position: "insideRight" }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#2563eb"
            yAxisId="left"
          />
          <Line
            type="monotone"
            dataKey="eps"
            stroke="#16a34a"
            yAxisId="right"
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#f97316"
            name="매출"
            yAxisId="left"
          />
          <Line
            type="monotone"
            dataKey="roe"
            stroke="#10b981"
            name="ROE"
            yAxisId="right"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
