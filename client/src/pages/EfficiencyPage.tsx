import { useState } from "react";
import { Link } from "wouter";
import { ExternalLink, Zap, Award } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { format } from "date-fns";

const cellTypes = [
  { value: "", label: "全部类型" },
  { value: "single_junction", label: "单结" },
  { value: "tandem_silicon", label: "钙钛矿/硅叠层" },
  { value: "tandem_perovskite", label: "全钙钛矿叠层" },
  { value: "flexible", label: "柔性" },
  { value: "module", label: "组件" },
  { value: "mini_module", label: "小组件" },
];

export default function EfficiencyPage() {
  const [selectedType, setSelectedType] = useState("");
  const { data: currentRecords } = trpc.efficiency.current.useQuery();
  const { data: allRecords, isLoading } = trpc.efficiency.list.useQuery({
    cellType: selectedType || undefined,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Header */}
        <div className="bg-foreground text-primary-foreground">
          <div className="container py-10 md:py-14">
            <div className="border-b border-primary-foreground/20 pb-4 mb-4">
              <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-primary-foreground/40">
                Efficiency Records
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-black text-primary-foreground leading-tight mb-3"
              style={{ fontFamily: "var(--font-display)" }}>
              钙钛矿电池效率记录
            </h1>
            <p className="font-sans text-sm text-primary-foreground/60 max-w-lg">
              追踪全球钙钛矿光伏电池光电转换效率世界纪录，数据来源于权威认证机构。
            </p>
          </div>
        </div>

        <div className="container py-10">
          {/* Current world records */}
          {currentRecords && currentRecords.length > 0 && (
            <section className="mb-12">
              <div className="editorial-rule mb-6">
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-gold" />
                  <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-ink-muted font-semibold">
                    当前世界纪录
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentRecords.map((rec) => (
                  <div key={rec.id} className="bg-foreground text-primary-foreground p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-sans text-[9px] tracking-[0.2em] uppercase text-primary-foreground/40">
                        {cellTypes.find((t) => t.value === rec.cellType)?.label ?? rec.cellType}
                      </span>
                      <Zap size={12} className="text-gold" />
                    </div>
                    <div className="mb-3">
                      <span className="font-display text-5xl font-black text-primary-foreground"
                        style={{ fontFamily: "var(--font-display)" }}>
                        {rec.efficiency}
                      </span>
                      <span className="font-display text-2xl font-black text-primary-foreground/60 ml-1">%</span>
                    </div>
                    <p className="font-sans text-xs text-primary-foreground/70 mb-1">{rec.institution}</p>
                    {rec.certifiedBy && (
                      <p className="font-sans text-[10px] text-primary-foreground/40">认证：{rec.certifiedBy}</p>
                    )}
                    {rec.recordDate && (
                      <p className="font-sans text-[10px] text-primary-foreground/40 mt-1">
                        {format(new Date(rec.recordDate), "yyyy年MM月")}
                      </p>
                    )}
                    {rec.area && (
                      <p className="font-sans text-[10px] text-primary-foreground/40">面积：{rec.area} cm²</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Historical records table */}
          <section>
            <div className="editorial-rule mb-6">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-ink-muted font-semibold">
                  历史效率记录
                </span>
              </div>
            </div>

            {/* Type filter */}
            <div className="flex flex-wrap gap-1 mb-6">
              {cellTypes.map((t) => (
                <button key={t.value} onClick={() => setSelectedType(t.value)}
                  className={`font-sans text-xs tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors ${selectedType === t.value ? "bg-foreground text-primary-foreground border-foreground" : "border-foreground/20 text-ink-muted hover:border-foreground hover:text-foreground"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {isLoading ? (
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
                      <th className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted text-left pb-3 pr-4">日期</th>
                      <th className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted text-left pb-3 pr-4">类型</th>
                      <th className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted text-right pb-3 pr-4">效率</th>
                      <th className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted text-right pb-3 pr-4">面积(cm²)</th>
                      <th className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted text-left pb-3 pr-4">机构</th>
                      <th className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted text-left pb-3 pr-4">认证机构</th>
                      <th className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted text-left pb-3">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRecords?.map((rec, idx) => (
                      <tr key={rec.id} className={`${idx % 2 === 0 ? "" : "bg-muted/30"} border-b border-foreground/5 hover:bg-muted/50 transition-colors`}>
                        <td className="font-sans text-xs text-ink-muted py-3 pr-4">
                          {rec.recordDate ? format(new Date(rec.recordDate), "yyyy-MM") : "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-sans text-[10px] text-foreground">
                            {cellTypes.find((t) => t.value === rec.cellType)?.label ?? rec.cellType}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="font-display text-base font-bold text-foreground"
                            style={{ fontFamily: "var(--font-display)" }}>
                            {rec.efficiency}%
                          </span>
                          {rec.isCurrentRecord && (
                            <span className="ml-1 text-gold text-[10px]">★</span>
                          )}
                        </td>
                        <td className="font-sans text-xs text-ink-muted py-3 pr-4 text-right">
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
                              <span className="font-sans text-[10px] text-ink-light line-clamp-1 max-w-[120px]">{rec.notes}</span>
                            )}
                            {rec.sourceUrl && (
                              <a href={rec.sourceUrl} target="_blank" rel="noopener noreferrer"
                                className="text-ink-light hover:text-foreground transition-colors flex-shrink-0">
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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

            {/* Legend */}
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
