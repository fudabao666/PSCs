import { useState, useMemo } from "react";
import { ExternalLink, Zap, Award, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────

const CELL_TYPES = [
  { value: "single_junction",    label: "单结",         labelEn: "Single Junction",    color: "#1a1a1a" },
  { value: "tandem_silicon",     label: "钙钛矿/硅叠层", labelEn: "Perovskite/Si Tandem", color: "#b5860d" },
  { value: "tandem_perovskite",  label: "全钙钛矿叠层",  labelEn: "All-Perovskite Tandem", color: "#7c3aed" },
  { value: "flexible",           label: "柔性",         labelEn: "Flexible",           color: "#0369a1" },
  { value: "module",             label: "组件",         labelEn: "Module",             color: "#15803d" },
  { value: "mini_module",        label: "小组件",        labelEn: "Mini-Module",        color: "#be185d" },
] as const;

type CellTypeValue = (typeof CELL_TYPES)[number]["value"];

const ALL_TYPES = CELL_TYPES.map((t) => t.value);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-foreground text-primary-foreground p-3 shadow-lg min-w-[180px]">
      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-primary-foreground/50 mb-2">
        {label}
      </p>
      {payload.map((entry: any) => {
        const typeInfo = CELL_TYPES.find((t) => t.value === entry.dataKey);
        return (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="font-sans text-[10px] text-primary-foreground/70">
                {typeInfo?.label ?? entry.dataKey}
              </span>
            </div>
            <span className="font-display text-sm font-bold text-primary-foreground" style={{ fontFamily: "var(--font-display)" }}>
              {entry.value}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Custom Dot (highlight current records) ───────────────────────────────────

function CustomDot(props: any) {
  const { cx, cy, payload, dataKey } = props;
  if (!payload || !cx || !cy) return null;
  const isLatest = payload[`${dataKey}_isLatest`];
  if (isLatest) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill={props.stroke} stroke="white" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={9} fill="none" stroke={props.stroke} strokeWidth={1} opacity={0.4} />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={3} fill={props.stroke} stroke="white" strokeWidth={1.5} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EfficiencyPage() {
  const [selectedTypes, setSelectedTypes] = useState<Set<CellTypeValue>>(
    () => new Set<CellTypeValue>(["single_junction", "tandem_silicon", "tandem_perovskite"])
  );
  const [filterType, setFilterType] = useState("");

  const { data: currentRecords } = trpc.efficiency.current.useQuery();
  const { data: chartRaw, isLoading: chartLoading } = trpc.efficiency.chartData.useQuery();
  const { data: allRecords, isLoading: tableLoading } = trpc.efficiency.list.useQuery({
    cellType: filterType || undefined,
  });

  // Toggle a cell type in the chart
  const toggleType = (type: CellTypeValue) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type); // keep at least one
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Build chart data: pivot rows into { year, single_junction: val, tandem_silicon: val, ... }
  const chartData = useMemo(() => {
    if (!chartRaw || chartRaw.length === 0) return [];

    // Group by year-month label
    const byDate = new Map<string, Record<string, number | boolean | string>>();

    // Track latest value per type for dot highlighting
    const latestByType: Partial<Record<CellTypeValue, { dateKey: string; value: number }>> = {};

    for (const row of chartRaw) {
      const dateKey = format(new Date(row.recordDate), "yyyy-MM");
      if (!byDate.has(dateKey)) byDate.set(dateKey, { dateKey });
      const entry = byDate.get(dateKey)!;
      const val = parseFloat(row.efficiency);
      entry[row.cellType] = val;

      const typeKey = row.cellType as CellTypeValue;
      const prev = latestByType[typeKey];
      if (!prev || new Date(row.recordDate) > new Date(prev.dateKey + "-01")) {
        latestByType[typeKey] = { dateKey, value: val };
      }
    }

    // Mark latest dots
    for (const typeKey of Object.keys(latestByType) as CellTypeValue[]) {
      const info = latestByType[typeKey];
      if (!info) continue;
      const entry = byDate.get(info.dateKey);
      if (entry) entry[`${typeKey}_isLatest`] = true;
    }

    return Array.from(byDate.values()).sort((a, b) =>
      (a.dateKey as unknown as string).localeCompare(b.dateKey as unknown as string)
    );
  }, [chartRaw]);

  const hasData = chartData.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Dark hero header */}
        <div className="bg-foreground text-primary-foreground">
          <div className="container py-10 md:py-14">
            <div className="border-b border-primary-foreground/20 pb-4 mb-4">
              <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-primary-foreground/40">
                Efficiency Records · 效率记录
              </span>
            </div>
            <h1
              className="font-display text-4xl md:text-6xl font-black text-primary-foreground leading-tight mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              钙钛矿电池效率记录
            </h1>
            <p className="font-sans text-sm text-primary-foreground/60 max-w-lg">
              追踪全球钙钛矿光伏电池光电转换效率世界纪录及历史演进，数据来源于权威认证机构。
            </p>
          </div>
        </div>

        <div className="container py-10">
          {/* ── World Records ─────────────────────────────────────────────── */}
          {currentRecords && currentRecords.length > 0 && (
            <section className="mb-14">
              <div className="flex items-center gap-2 mb-6">
                <Award size={14} className="text-gold" />
                <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-ink-muted font-semibold">
                  当前世界纪录
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {currentRecords.map((rec) => {
                  const typeInfo = CELL_TYPES.find((t) => t.value === rec.cellType);
                  return (
                    <div key={rec.id} className="bg-foreground text-primary-foreground p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-sans text-[8px] tracking-[0.2em] uppercase text-primary-foreground/40 leading-tight">
                          {typeInfo?.label ?? rec.cellType}
                        </span>
                        <Zap size={10} className="text-gold flex-shrink-0" />
                      </div>
                      <div className="mb-1">
                        <span
                          className="font-display text-3xl font-black text-primary-foreground"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {rec.efficiency}
                        </span>
                        <span className="font-display text-lg font-black text-primary-foreground/50 ml-0.5">%</span>
                      </div>
                      <p className="font-sans text-[9px] text-primary-foreground/60 leading-snug">{rec.institution}</p>
                      {rec.recordDate && (
                        <p className="font-sans text-[9px] text-primary-foreground/30 mt-0.5">
                          {format(new Date(rec.recordDate), "yyyy-MM")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Trend Chart ───────────────────────────────────────────────── */}
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-ink-muted" />
              <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-ink-muted font-semibold">
                效率历史演进曲线
              </span>
            </div>
            <p className="font-sans text-xs text-ink-light mb-6">
              点击图例切换显示的电池类型，末端实心圆点为当前最高纪录。
            </p>

            {/* Type toggle buttons */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {CELL_TYPES.filter((t) => ALL_TYPES.includes(t.value)).map((t) => {
                const active = selectedTypes.has(t.value);
                return (
                  <button
                    key={t.value}
                    onClick={() => toggleType(t.value)}
                    className={`inline-flex items-center gap-1.5 font-sans text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors ${
                      active
                        ? "border-foreground/40 text-foreground bg-foreground/5"
                        : "border-foreground/10 text-ink-light hover:border-foreground/30"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 transition-opacity"
                      style={{ backgroundColor: t.color, opacity: active ? 1 : 0.25 }}
                    />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Chart */}
            <div className="bg-muted/30 border border-foreground/8 p-4 md:p-6">
              {chartLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-pulse font-sans text-xs text-ink-light">加载图表数据...</div>
                </div>
              ) : !hasData ? (
                <div className="h-80 flex flex-col items-center justify-center gap-3">
                  <TrendingUp size={32} className="text-foreground/10" />
                  <p className="font-sans text-sm text-ink-light">暂无效率历史数据</p>
                  <p className="font-sans text-xs text-ink-light">
                    请前往「管理后台 → 数据更新」初始化效率记录数据
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(0,0,0,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="dateKey"
                      tick={{ fontFamily: "var(--font-sans)", fontSize: 10, fill: "var(--ink-light)" }}
                      axisLine={{ stroke: "rgba(0,0,0,0.15)" }}
                      tickLine={false}
                      tickFormatter={(v: string) => v.slice(0, 4)}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[8, 38]}
                      tick={{ fontFamily: "var(--font-sans)", fontSize: 10, fill: "var(--ink-light)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                      width={38}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(value) => {
                        const t = CELL_TYPES.find((c) => c.value === value);
                        return (
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--ink-muted)" }}>
                            {t?.label ?? value}
                          </span>
                        );
                      }}
                      wrapperStyle={{ paddingTop: 12 }}
                    />
                    {/* Theoretical limit reference line */}
                    <ReferenceLine
                      y={33.7}
                      stroke="rgba(0,0,0,0.12)"
                      strokeDasharray="6 3"
                      label={{
                        value: "SQ极限 33.7%",
                        position: "insideTopRight",
                        style: { fontFamily: "var(--font-sans)", fontSize: 9, fill: "rgba(0,0,0,0.3)" },
                      }}
                    />

                    {CELL_TYPES.filter((t) => selectedTypes.has(t.value)).map((t) => (
                      <Line
                        key={t.value}
                        type="monotone"
                        dataKey={t.value}
                        stroke={t.color}
                        strokeWidth={2}
                        dot={<CustomDot />}
                        activeDot={{ r: 5, stroke: "white", strokeWidth: 2 }}
                        connectNulls
                        name={t.value}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chart footnote */}
            {hasData && (
              <p className="font-sans text-[10px] text-ink-light mt-3">
                数据来源：NREL Best Research-Cell Efficiency Chart 及各机构公开报告 ·
                末端标注圆点为当前各类型最高纪录 · SQ极限为单结钙钛矿理论效率上限
              </p>
            )}
          </section>

          {/* ── Historical Records Table ──────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-ink-muted font-semibold">
                历史效率记录
              </span>
            </div>

            {/* Type filter */}
            <div className="flex flex-wrap gap-1 mb-6">
              <button
                onClick={() => setFilterType("")}
                className={`font-sans text-xs tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors ${
                  filterType === ""
                    ? "bg-foreground text-primary-foreground border-foreground"
                    : "border-foreground/20 text-ink-muted hover:border-foreground hover:text-foreground"
                }`}
              >
                全部类型
              </button>
              {CELL_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFilterType(t.value)}
                  className={`font-sans text-xs tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors ${
                    filterType === t.value
                      ? "bg-foreground text-primary-foreground border-foreground"
                      : "border-foreground/20 text-ink-muted hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tableLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-foreground">
                      {["日期", "类型", "效率", "面积(cm²)", "机构", "认证机构", "备注"].map((h) => (
                        <th
                          key={h}
                          className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted text-left pb-3 pr-4 last:pr-0"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allRecords?.map((rec, idx) => {
                      const typeInfo = CELL_TYPES.find((t) => t.value === rec.cellType);
                      return (
                        <tr
                          key={rec.id}
                          className={`${
                            idx % 2 === 0 ? "" : "bg-muted/30"
                          } border-b border-foreground/5 hover:bg-muted/50 transition-colors`}
                        >
                          <td className="font-sans text-xs text-ink-muted py-3 pr-4">
                            {rec.recordDate ? format(new Date(rec.recordDate), "yyyy-MM") : "—"}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center gap-1.5 font-sans text-[10px] text-foreground">
                              <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: typeInfo?.color ?? "#999" }}
                              />
                              {typeInfo?.label ?? rec.cellType}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className="font-display text-base font-bold text-foreground"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {rec.efficiency}%
                            </span>
                            {rec.isCurrentRecord && (
                              <span className="ml-1 text-gold text-[10px]">★</span>
                            )}
                          </td>
                          <td className="font-sans text-xs text-ink-muted py-3 pr-4 text-left">
                            {rec.area ?? "—"}
                          </td>
                          <td className="font-sans text-xs text-foreground py-3 pr-4 max-w-[160px] truncate">
                            {rec.institution}
                          </td>
                          <td className="font-sans text-xs text-ink-muted py-3 pr-4">
                            {rec.certifiedBy ?? "—"}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              {rec.notes && (
                                <span className="font-sans text-[10px] text-ink-light line-clamp-1 max-w-[120px]">
                                  {rec.notes}
                                </span>
                              )}
                              {rec.sourceUrl && (
                                <a
                                  href={rec.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-ink-light hover:text-foreground transition-colors flex-shrink-0"
                                >
                                  <ExternalLink size={11} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!allRecords || allRecords.length === 0) && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <p className="font-sans text-sm text-ink-light">暂无效率记录数据</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-foreground/10">
              <p className="font-sans text-[10px] text-ink-light">
                ★ 表示当前世界纪录 · 数据来源于权威认证机构（NREL、CPVT等）· 效率数据仅供参考
              </p>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
