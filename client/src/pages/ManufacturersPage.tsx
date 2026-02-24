import { useState } from "react";
import { Link } from "wouter";
import { Search, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const stageOptions = [
  { value: "", label: "全部阶段" },
  { value: "research", label: "研发阶段" },
  { value: "pilot", label: "中试阶段" },
  { value: "mass_production", label: "量产阶段" },
  { value: "listed", label: "已上市" },
];

const countryOptions = [
  { value: "", label: "全球" },
  { value: "中国", label: "中国" },
];

const stageColors: Record<string, string> = {
  research: "text-blue-600 border-blue-300",
  pilot: "text-amber-600 border-amber-300",
  mass_production: "text-emerald-600 border-emerald-300",
  listed: "text-purple-600 border-purple-300",
};

export default function ManufacturersPage() {
  const [page, setPage] = useState(1);
  const [stage, setStage] = useState("");
  const [country, setCountry] = useState("");
  const [keyword, setKeyword] = useState("");
  const [inputValue, setInputValue] = useState("");

  const { data, isLoading } = trpc.manufacturers.list.useQuery({
    page,
    pageSize: 24,
    stage: stage || undefined,
    country: country || undefined,
    keyword: keyword || undefined,
  });

  const totalPages = data ? Math.ceil(data.total / 24) : 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(inputValue);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Header */}
        <div className="border-b border-foreground/10 bg-muted/30">
          <div className="container py-8">
            <div className="editorial-rule-thick mb-4" />
            <h1 className="font-display text-4xl md:text-5xl font-black text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
              全球厂家数据库
            </h1>
            <p className="font-sans text-sm text-ink-muted">
              汇聚全球钙钛矿光伏行业主要参与企业 · 信息每日更新
            </p>
            {data && (
              <p className="font-sans text-xs text-ink-light mt-2">
                共收录 <span className="text-foreground font-semibold">{data.total}</span> 家企业
              </p>
            )}
          </div>
        </div>

        <div className="container py-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex flex-wrap gap-1">
              {countryOptions.map((c) => (
                <button key={c.value} onClick={() => { setCountry(c.value); setPage(1); }}
                  className={`font-sans text-xs tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors ${country === c.value ? "bg-foreground text-primary-foreground border-foreground" : "border-foreground/20 text-ink-muted hover:border-foreground hover:text-foreground"}`}>
                  {c.label}
                </button>
              ))}
              <div className="w-px bg-foreground/10 mx-1" />
              {stageOptions.map((s) => (
                <button key={s.value} onClick={() => { setStage(s.value); setPage(1); }}
                  className={`font-sans text-xs tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors ${stage === s.value ? "bg-foreground text-primary-foreground border-foreground" : "border-foreground/20 text-ink-muted hover:border-foreground hover:text-foreground"}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSearch} className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1.5 border-b border-foreground/20 pb-0.5 focus-within:border-foreground transition-colors">
                <Search size={12} className="text-ink-light" />
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                  placeholder="搜索企业名称..." className="bg-transparent font-sans text-xs text-foreground placeholder:text-ink-light outline-none w-40" />
              </div>
              <button type="submit" className="font-sans text-[10px] tracking-[0.12em] uppercase text-ink-muted hover:text-foreground transition-colors">搜索</button>
            </form>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-muted animate-pulse h-40 rounded" />
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="py-20 text-center">
              <Building2 size={40} className="mx-auto mb-4 text-foreground/10" />
              <p className="font-display text-2xl font-bold text-foreground/20 mb-2" style={{ fontFamily: "var(--font-display)" }}>暂无企业数据</p>
              <p className="font-sans text-sm text-ink-light">请尝试其他筛选条件或等待数据更新</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data?.items.map((mfg) => (
                <Link key={mfg.id} href={`/manufacturers/${mfg.id}`}
                  className="group bg-card border border-foreground/10 p-5 hover:border-foreground/40 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 bg-foreground/5 flex items-center justify-center border border-foreground/10">
                      {mfg.logoUrl ? (
                        <img src={mfg.logoUrl} alt={mfg.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 size={14} className="text-ink-muted" />
                      )}
                    </div>
                    <span className={`category-badge text-[8px] ${stageColors[mfg.stage] ?? "text-ink-muted border-ink-muted"}`}>
                      {stageOptions.find((s) => s.value === mfg.stage)?.label ?? mfg.stage}
                    </span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-foreground group-hover:text-ink-muted transition-colors leading-snug mb-0.5 line-clamp-1"
                    style={{ fontFamily: "var(--font-display)" }}>
                    {mfg.name}
                  </h3>
                  {mfg.nameEn && (
                    <p className="font-sans text-[10px] text-ink-light line-clamp-1 mb-1">{mfg.nameEn}</p>
                  )}
                  <p className="font-sans text-[10px] text-ink-light">
                    {mfg.country}{mfg.region ? ` · ${mfg.region}` : ""}
                  </p>
                  {mfg.foundedYear && (
                    <p className="font-sans text-[10px] text-ink-light">成立 {mfg.foundedYear}</p>
                  )}
                  {mfg.stockCode && (
                    <p className="font-sans text-[10px] text-gold font-semibold mt-1">{mfg.stockCode}</p>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 border border-foreground/20 text-ink-muted hover:border-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const p = page <= 4 ? i + 1 : page - 3 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 font-sans text-xs border transition-colors ${p === page ? "bg-foreground text-primary-foreground border-foreground" : "border-foreground/20 text-ink-muted hover:border-foreground hover:text-foreground"}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 border border-foreground/20 text-ink-muted hover:border-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
