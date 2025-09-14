import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Info,
  ListFilter,
  LineChart as LineChartIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Tabs, TabsList, TabsTrigger } from "./tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Input } from "./input";
import { Button } from "./button";
import { TESTDATA } from "../data/testData";

export type Periodicity = "quarterly" | "annual";
export type Sector =
  | "Information Technology"
  | "Consumer Discretionary"
  | "Health Care"
  | "Financials"
  | "Industrials";

export interface FundamentalsSnapshot {
  // 단순화를 위해 필요한 최소 항목만
  period: string; // e.g. "2025Q2" or "2024"
  eps: number; // 주당순이익
  price: number; // 해당 스냅샷 시점 종가(백테스트 단순화)
  per?: number; // price / eps (eps<=0이면 undefined 처리)
}

export interface TickerRow {
  symbol: string;
  name: string;
  sector: Sector;
  periodicity: Periodicity; // 본 스냅샷 시계열의 주기
  snapshots: FundamentalsSnapshot[]; // 최신순 정렬 가정
}

// ===== 유틸 =====
function calcPER(eps: number, price: number): number | undefined {
  if (eps <= 0) return undefined;
  return price / eps;
}

function enrichWithPER(rows: TickerRow[]): TickerRow[] {
  return rows.map((r) => ({
    ...r,
    snapshots: r.snapshots.map((s) => ({ ...s, per: calcPER(s.eps, s.price) })),
  }));
}

function latestSnapshot(row: TickerRow) {
  return row.snapshots[0]; // 최신순 가정
}

function pctChange(a: number, b: number) {
  if (b === 0) return undefined;
  return (a - b) / b;
}

function byPeriodicity(rows: TickerRow[], p: Periodicity) {
  return rows.filter((r) => r.periodicity === p);
}

function groupBySector(rows: TickerRow[]) {
  return rows.reduce<Record<string, TickerRow[]>>((acc, r) => {
    acc[r.sector] = acc[r.sector] || [];
    acc[r.sector].push(r);
    return acc;
  }, {});
}

function aggregateSectorPER(rows: TickerRow[]) {
  const groups = groupBySector(rows);
  return Object.entries(groups).map(([sector, arr]) => {
    const pers = arr
      .map((r) => latestSnapshot(r).per)
      .filter((x): x is number => typeof x === "number");
    const avg = pers.length
      ? pers.reduce((a, b) => a + b, 0) / pers.length
      : undefined;
    const sorted = [...pers].sort((a, b) => a - b);
    const low = sorted[0];
    const high = sorted[sorted.length - 1];
    return {
      sector,
      avgPER: avg,
      lowPER: low,
      highPER: high,
      count: arr.length,
    };
  });
}

function risingSectors(rows: TickerRow[]) {
  const groups = groupBySector(rows);
  // 최근-이전 가격 상승률 평균으로 판단
  return Object.entries(groups).map(([sector, arr]) => {
    const changes = arr
      .map((r) =>
        pctChange(
          r.snapshots[0].price,
          r.snapshots[1]?.price ?? r.snapshots[0].price
        )
      )
      .filter((x): x is number => typeof x === "number");
    const avgRise = changes.length
      ? changes.reduce((a, b) => a + b, 0) / changes.length
      : 0;
    return { sector, avgRise };
  });
}

function risingTickers(rows: TickerRow[]) {
  return rows
    .map((r) => ({
      symbol: r.symbol,
      name: r.name,
      sector: r.sector,
      rise:
        pctChange(
          r.snapshots[0].price,
          r.snapshots[1]?.price ?? r.snapshots[0].price
        ) ?? 0,
      latest: r.snapshots[0],
      prev: r.snapshots[1] ?? r.snapshots[0],
    }))
    .sort((a, b) => b.rise - a.rise);
}

function findRiseStartIndex(row: TickerRow): number {
  // 단순 룰: 최근 시점이 직전 대비 상승이면 그 직전이 '상승 시작'으로 간주,
  // 아니라면 더 과거로 이동. (실전에서는 스윙탐지/모멘텀 룰로 교체 가능)
  for (let i = 0; i < row.snapshots.length - 1; i++) {
    const now = row.snapshots[i];
    const prev = row.snapshots[i + 1];
    if (now.price > prev.price) {
      return i + 1; // 상승 시작의 전 시점 index
    }
  }
  return row.snapshots.length - 1; // 못 찾으면 맨 뒤
}

// ===== 테이블 컴포넌트 =====
function DataRow({ label, value }: { label: string; value?: number | string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">
        {typeof value === "number" ? value.toFixed(2) : value ?? "-"}
      </span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <LineChartIcon className="w-5 h-5" />
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// ===== 메인 컴포넌트 =====
export default function USStockSectorScreener() {
  const [periodicity, setPeriodicity] = useState<Periodicity>("quarterly");
  const [sectorFilter, setSectorFilter] = useState<string | "all">("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [perMax, setPerMax] = useState<number | null>(null);
  const [epsMin, setEpsMin] = useState<number | null>(null);

  const enriched = useMemo(() => enrichWithPER(TESTDATA), []);
  const base = useMemo(
    () => byPeriodicity(enriched, periodicity),
    [enriched, periodicity]
  );
  const filtered = useMemo(
    () =>
      base.filter((r) => {
        if (sectorFilter !== "all" && r.sector !== sectorFilter) return false;

        const latest = latestSnapshot(r);
        if (perMax !== null && (latest.per ?? Infinity) > perMax) return false;
        if (epsMin !== null && latest.eps < epsMin) return false;

        return true;
      }),
    [base, sectorFilter, perMax, epsMin]
  );

  const sectorAgg = useMemo(() => aggregateSectorPER(filtered), [filtered]);
  const topRisingSectors = useMemo(
    () => risingSectors(filtered).sort((a, b) => b.avgRise - a.avgRise),
    [filtered]
  );
  const topRisingTickers = useMemo(
    () =>
      risingTickers(
        filtered.filter((r) =>
          search
            ? r.symbol.toLowerCase().includes(search.toLowerCase()) ||
              r.name.toLowerCase().includes(search.toLowerCase())
            : true
        )
      ),
    [filtered, search]
  );

  const sectors: Sector[] = [
    "Information Technology",
    "Consumer Discretionary",
    "Health Care",
    "Financials",
    "Industrials",
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-screen mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl md:text-3xl font-bold mb-2"
      >
        미국 주식 섹터 분석 스크리너 <Badge variant="secondary">v0.1</Badge>
      </motion.h1>
      <p className="text-sm text-muted-foreground mb-6">
        목표: 섹터/종목의 펀더멘털(PER 중심)과 가격 모멘텀을 단순 조합하여,{" "}
        <b>뉴스/정치 이벤트를 배제</b>한 정량 의사결정 기준을 제공합니다.
      </p>

      {/* 컨트롤 바 */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6">
        <Tabs
          value={periodicity}
          onValueChange={(v) => setPeriodicity(v as Periodicity)}
        >
          <TabsList>
            <TabsTrigger value="quarterly">분기</TabsTrigger>
            <TabsTrigger value="annual">연간</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={sectorFilter} onValueChange={setSectorFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="섹터 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 섹터</SelectItem>
            {sectors.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="심볼/종목명 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button variant="secondary" className="gap-2">
            <ListFilter className="w-4 h-4" />
            필터
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center mb-6">
        <Input
          type="number"
          placeholder="PER 최대값 (예: 20)"
          value={perMax ?? ""}
          onChange={(e) =>
            setPerMax(e.target.value ? Number(e.target.value) : null)
          }
          className="w-full sm:w-48"
        />
        <Input
          type="number"
          placeholder="EPS 최소값 (예: 1.0)"
          value={epsMin ?? ""}
          onChange={(e) =>
            setEpsMin(e.target.value ? Number(e.target.value) : null)
          }
          className="w-full sm:w-48"
        />
        <Button
          variant="outline"
          onClick={() => {
            setPerMax(null);
            setEpsMin(null);
          }}
        >
          조건 초기화
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 좌: 섹터 집계 */}
        <div className="lg:col-span-3 space-y-4">
          <Section title="섹터별 PER 집계 (평균/상·하위)">
            <div className="w-full h-72">
              <ResponsiveContainer>
                <BarChart
                  data={sectorAgg}
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgPER" name="평균 PER" />
                  <Bar dataKey="lowPER" name="최저 PER" />
                  <Bar dataKey="highPER" name="최고 PER" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <Section title="최근 상승 섹터 (평균 상승률)">
            <div className="w-full h-64">
              <ResponsiveContainer>
                <BarChart
                  data={topRisingSectors}
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip
                    formatter={(v) => `${((v as number) * 100).toFixed(2)}%`}
                  />
                  <Bar dataKey="avgRise" name="평균 상승률" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>

        {/* 우: 히트리스트 */}
        <div className="lg:col-span-2 space-y-4">
          <Section title="최근 상승 종목">
            <div className="space-y-2">
              {topRisingTickers.slice(0, rowsPerPage).map((t) => (
                <Card
                  key={`${t.symbol}-${t.latest.period}`}
                  className="border-muted rounded-xl"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-base">
                          {t.name}{" "}
                          <span className="text-muted-foreground">
                            ({t.symbol})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t.sector}
                        </div>
                      </div>
                      <Badge
                        variant={t.rise >= 0 ? "default" : "destructive"}
                        className="gap-1"
                      >
                        {t.rise >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {(t.rise * 100).toFixed(1)}%
                      </Badge>
                    </div>

                    {/* (3) 조건: 상승 시작 이전 분기 재무 */}
                    <RiseContext
                      row={
                        enriched.find(
                          (r) =>
                            r.symbol === t.symbol &&
                            r.periodicity === periodicity
                        )!
                      }
                    />
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-end pt-2">
                <Select
                  value={String(rowsPerPage)}
                  onValueChange={(v) => setRowsPerPage(Number(v))}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}개
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* 설명 */}
      <div className="mt-8">
        <Card className="bg-muted/40 rounded-2xl">
          <CardContent className="p-4 sm:p-6 text-sm leading-relaxed">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5" />
              <div>
                <p className="mb-2 font-medium">판단 기준(초안)</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>
                    섹터 선별: 최근 분기/연간 기준 평균 상승률 상위 섹터 → 해당
                    섹터 중 PER가 평균 이하이면서 EPS가 개선되는 종목 우선
                  </li>
                  <li>
                    종목 선별: 직전→최신 가격 상승 & PER이 과거 대비 과도하지
                    않은지 체크
                  </li>
                  <li>
                    데이터는 뉴스/정치 이벤트 배제. 오로지 재무와 가격 시그널만
                    반영
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RiseContext({ row }: { row: TickerRow }) {
  const startIdx = findRiseStartIndex(row);
  const prevIdx = Math.min(startIdx + 1, row.snapshots.length - 1); // '상승 시작 이전 시점'
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
          </CardContent>
        </Card>
        <Card className="bg-background/60">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">상승 시작</div>
            <DataRow label="기간" value={start.period} />
            <DataRow label="가격" value={start.price} />
            <DataRow label="EPS" value={start.eps} />
            <DataRow label="PER" value={start.per} />
          </CardContent>
        </Card>
        <Card className="bg-background/60">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">최신</div>
            <DataRow label="기간" value={latest.period} />
            <DataRow label="가격" value={latest.price} />
            <DataRow label="EPS" value={latest.eps} />
            <DataRow label="PER" value={latest.per} />
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
