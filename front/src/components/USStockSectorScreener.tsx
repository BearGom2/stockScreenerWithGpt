import React, { useEffect, useMemo, useState } from "react";
import { fetchSP500Data } from "../lib/api";
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
import {
  aggregateSectorPER,
  byPeriodicity,
  enrichWithPER,
  latestSnapshot,
  risingSectors,
  risingTickers,
} from "../lib/stocks";
import type { Periodicity, Sector, TickerRow, SectorFilter } from "../types";
import { SECTORS } from "../types";
import StockTable from "./StockTable";
import StockChart from "./StockChart";
import RiseContext from "./RiseContext";
import StockDetailModal from "./StockDetailModal";
import SectorDetailModal from "./SectorDetailModal";
// After refactoring, fetchSP500Data already returns TickerRow[] so adaptApiData
// and ApiTicker types are no longer imported here.

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
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [perMax, setPerMax] = useState<number | null>(null);
  const [epsMin, setEpsMin] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<TickerRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sectorModalOpen, setSectorModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  // The tickers state now holds TickerRow objects rather than raw API data.
  const [tickers, setTickers] = useState<TickerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchSP500Data();
      setTickers(data);
      setLoading(false);
    }
    load();
  }, []);

  const enriched = useMemo(() => {
    // The backend does not compute PER; compute it here.
    return enrichWithPER(tickers);
  }, [tickers]);
  const base = useMemo(
    () => byPeriodicity(enriched, periodicity),
    [enriched, periodicity]
  );
  const filtered = useMemo(() => {
    return base.filter((r) => {
      if (sectorFilter !== "all" && r.sector !== sectorFilter) return false;
      const latest = latestSnapshot(r);
      if (perMax !== null && (latest.per ?? Infinity) > perMax) return false;
      if (epsMin !== null && latest.eps < epsMin) return false;
      return true;
    });
  }, [base, sectorFilter, perMax, epsMin]);

  const sectorAgg = useMemo(() => aggregateSectorPER(filtered), [filtered]);
  const topRisingSectors = useMemo(
    () => risingSectors(filtered).sort((a, b) => b.avgRise - a.avgRise),
    [filtered]
  );
  const topRisingTickers = useMemo(() => {
    return risingTickers(
      filtered.filter((r) =>
        search
          ? r.symbol.toLowerCase().includes(search.toLowerCase()) ||
            r.name.toLowerCase().includes(search.toLowerCase())
          : true
      )
    );
  }, [filtered, search]);

  if (loading) return <div className="p-6">Loading S&P500 data...</div>;

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
        <Select
          value={sectorFilter}
          onValueChange={(v) => setSectorFilter(v as SectorFilter)}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="섹터 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 섹터</SelectItem>
            {SECTORS.map((s) => (
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
      <Section title="종목 테이블 뷰 (정렬 가능)">
        <StockTable rows={filtered} />
      </Section>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 좌: 섹터 집계 */}
        <div className="lg:col-span-3 space-y-4">
          <Section title="섹터별 PER 집계 (평균/상·하위)">
            <div className="w-full h-72">
              <ResponsiveContainer>
                <BarChart
                  data={sectorAgg}
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                  onClick={(e) => {
                    const label = (e && e.activeLabel) as string | undefined;
                    if (label) {
                      setSelectedSector(label as Sector);
                      setSectorModalOpen(true);
                    }
                  }}
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
                  onClick={(e) => {
                    const label = (e && e.activeLabel) as string | undefined;
                    if (label) {
                      setSelectedSector(label as Sector);
                      setSectorModalOpen(true);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v) =>
                      `${((v as number) * 100).toFixed(0)}%`
                    }
                  />
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
                    <StockChart
                      row={
                        enriched.find(
                          (r) =>
                            r.symbol === t.symbol &&
                            r.periodicity === periodicity
                        )!
                      }
                    />
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const row = enriched.find(
                            (r) =>
                              r.symbol === t.symbol &&
                              r.periodicity === periodicity
                          )!;
                          setSelectedRow(row);
                          setDetailOpen(true);
                        }}
                      >
                        상세보기
                      </Button>
                    </div>
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
                    종목 선별: 직전→최신 가격 상승 &amp; PER이 과거 대비
                    과도하지 않은지 체크
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
      <SectorDetailModal
        open={sectorModalOpen}
        onOpenChange={setSectorModalOpen}
        sector={selectedSector}
        rows={filtered}
      />
      <StockDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        row={selectedRow}
      />
    </div>
  );
}
