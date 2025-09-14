import { Card, CardContent } from "./card";
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
import { findRiseStartIndex } from "../lib/stocks"; // 이미 util에 있는 함수라고 가정
import DataRow from "./DataRow";

export default function RiseContext({ row }: { row: TickerRow }) {
  const startIdx = findRiseStartIndex(row);
  const prevIdx = Math.min(startIdx + 1, row.snapshots.length - 1);
  const latest = row.snapshots[0];
  const start = row.snapshots[startIdx];
  const beforeStart = row.snapshots[prevIdx];

  const series = [
    {
      label: beforeStart.period,
      price: beforeStart.price,
      eps: beforeStart.eps,
      per: beforeStart.per,
    },
    { label: start.period, price: start.price, eps: start.eps, per: start.per },
    {
      label: latest.period,
      price: latest.price,
      eps: latest.eps,
      per: latest.per,
    },
  ];

  return (
    <div className="mt-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-background/60">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">
              상승 시작 이전
            </div>
            <DataRow label="기간" value={beforeStart.period} />
            <DataRow label="가격" value={beforeStart.price} />
            <DataRow label="EPS" value={beforeStart.eps} />
            <DataRow label="PER" value={beforeStart.per} />
            <DataRow label="매출" value={beforeStart.revenue} />
            <DataRow
              label="ROE"
              value={
                beforeStart.roe ? (beforeStart.roe * 100).toFixed(1) + "%" : "-"
              }
            />
            <DataRow
              label="부채비율"
              value={
                beforeStart.debtEquity
                  ? (beforeStart.debtEquity * 100).toFixed(0) + "%"
                  : "-"
              }
            />
          </CardContent>
        </Card>
        <Card className="bg-background/60">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">상승 시작</div>
            <DataRow label="기간" value={start.period} />
            <DataRow label="가격" value={start.price} />
            <DataRow label="EPS" value={start.eps} />
            <DataRow label="PER" value={start.per} />
            <DataRow label="매출" value={beforeStart.revenue} />
            <DataRow
              label="ROE"
              value={
                beforeStart.roe ? (beforeStart.roe * 100).toFixed(1) + "%" : "-"
              }
            />
            <DataRow
              label="부채비율"
              value={
                beforeStart.debtEquity
                  ? (beforeStart.debtEquity * 100).toFixed(0) + "%"
                  : "-"
              }
            />
          </CardContent>
        </Card>
        <Card className="bg-background/60">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">최신</div>
            <DataRow label="기간" value={latest.period} />
            <DataRow label="가격" value={latest.price} />
            <DataRow label="EPS" value={latest.eps} />
            <DataRow label="PER" value={latest.per} />
            <DataRow label="매출" value={beforeStart.revenue} />
            <DataRow
              label="ROE"
              value={
                beforeStart.roe ? (beforeStart.roe * 100).toFixed(1) + "%" : "-"
              }
            />
            <DataRow
              label="부채비율"
              value={
                beforeStart.debtEquity
                  ? (beforeStart.debtEquity * 100).toFixed(0) + "%"
                  : "-"
              }
            />
          </CardContent>
        </Card>
      </div>

      <div className="w-full h-40 mt-3">
        <ResponsiveContainer>
          <LineChart
            data={series}
            margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="price" name="가격" yAxisId="left" />
            <Line type="monotone" dataKey="eps" name="EPS" yAxisId="right" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
