import { useState } from "react";
import { Link } from "wouter";
import { Search, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { format } from "date-fns";

const projectTypes = [
  { value: "", label: "全部类型" },
  { value: "procurement", label: "设备采购" },
  { value: "construction", label: "工程建设" },
  { value: "research", label: "研究合作" },
  { value: "service", label: "服务外包" },
  { value: "other", label: "其他" },
];

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "open", label: "招标中" },
  { value: "closed", label: "已截止" },
  { value: "awarded", label: "已中标" },
  { value: "cancelled", label: "已取消" },
];

const statusStyles: Record<string, string> = {
  open: "text-emerald-700 border-emerald-700",
  closed: "text-ink-muted border-ink-muted",
  awarded: "text-blue-700 border-blue-700",
  cancelled: "text-destructive border-destructive",
};

const statusLabels: Record<string, string> = {
  open: "招标中", closed: "已截止", awarded: "已中标", cancelled: "已取消",
};

export default function TendersPage() {
  const [page, setPage] = useState(1);
  const [projectType, setProjectType] = useState("");
  const [status, setStatus] = useState("open");
  const [region, setRegion] = useState("");
  const [keyword, setKeyword] = useState("");
  const [inputValue, setInputValue] = useState("");

  const { data, isLoading } = trpc.tenders.list.useQuery({
    page,
    pageSize: 20,
    projectType: projectType || undefined,
    status: status || undefined,
    region: region || undefined,
    keyword: keyword || undefined,
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(inputValue);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-foreground text-primary-foreground">
          <div className="container py-10 md:py-14">
            <div className="border-b border-primary-foreground/20 pb-4 mb-4">
              <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-primary-foreground/40">
                Tender Information Zone
              </span>
            </div>
            <h1
              className="font-display text-4xl md:text-6xl font-black text-primary-foreground leading-tight mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              招投标信息专区
            </h1>
            <p className="font-sans text-sm text-primary-foreground/60 max-w-lg">
              汇聚全球钙钛矿光伏行业招投标信息，涵盖设备采购、工程建设、研究合作等各类项目，每日自动更新。
            </p>
            {data && (
              <div className="flex items-center gap-6 mt-6">
                <div>
                  <span className="font-display text-3xl font-black text-primary-foreground" style={{ fontFamily: "var(--font-display)" }}>
                    {data.total}
                  </span>
                  <span className="font-sans text-xs text-primary-foreground/40 ml-2">条信息</span>
                </div>
                <div className="h-8 w-px bg-primary-foreground/20" />
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-sans text-xs text-primary-foreground/60">实时更新</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="container py-8">
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-8">
            {/* Type tabs */}
            <div className="flex flex-wrap gap-1">
              {projectTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setProjectType(t.value); setPage(1); }}
                  className={`font-sans text-xs tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors ${
                    projectType === t.value
                      ? "bg-foreground text-primary-foreground border-foreground"
                      : "border-foreground/20 text-ink-muted hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {/* Status filter */}
              <div className="flex gap-1">
                {statusOptions.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { setStatus(s.value); setPage(1); }}
                    className={`font-sans text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 border transition-colors ${
                      status === s.value
                        ? "bg-foreground text-primary-foreground border-foreground"
                        : "border-foreground/15 text-ink-light hover:border-foreground/40"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Region input */}
              <div className="flex items-center gap-1.5 border-b border-foreground/20 pb-0.5 focus-within:border-foreground transition-colors">
                <input
                  type="text"
                  value={region}
                  onChange={(e) => { setRegion(e.target.value); setPage(1); }}
                  placeholder="地区筛选..."
                  className="bg-transparent font-sans text-xs text-foreground placeholder:text-ink-light outline-none w-28"
                />
              </div>

              {/* Keyword search */}
              <form onSubmit={handleSearch} className="flex items-center gap-2 ml-auto">
                <div className="flex items-center gap-1.5 border-b border-foreground/20 pb-0.5 focus-within:border-foreground transition-colors">
                  <Search size={12} className="text-ink-light" />
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="搜索招投标..."
                    className="bg-transparent font-sans text-xs text-foreground placeholder:text-ink-light outline-none w-40"
                  />
                </div>
                <button type="submit" className="font-sans text-[10px] tracking-[0.12em] uppercase text-ink-muted hover:text-foreground transition-colors">
                  搜索
                </button>
              </form>
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="py-5 border-b border-foreground/10 animate-pulse">
                  <div className="h-3 bg-muted rounded w-32 mb-2" />
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="py-20 text-center">
              <TrendingUp size={40} className="mx-auto mb-4 text-foreground/10" />
              <p className="font-display text-2xl font-bold text-foreground/20 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                暂无招投标信息
              </p>
              <p className="font-sans text-sm text-ink-light">请尝试其他筛选条件</p>
            </div>
          ) : (
            <div className="space-y-0">
              {data?.items.map((item, idx) => (
                <Link
                  key={item.id}
                  href={`/tenders/${item.id}`}
                  className={`group flex items-start gap-4 py-5 ${idx < (data?.items.length ?? 0) - 1 ? "border-b border-foreground/10" : ""} hover:bg-muted/40 transition-colors -mx-2 px-2`}
                >
                  <div className="flex-shrink-0 w-8 h-8 border border-foreground/15 flex items-center justify-center mt-0.5">
                    <span className="font-display text-xs font-bold text-foreground/30" style={{ fontFamily: "var(--font-display)" }}>
                      {String((page - 1) * 20 + idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="category-badge text-[9px] text-ink-muted border-ink-muted">
                        {projectTypes.find((t) => t.value === item.projectType)?.label ?? item.projectType}
                      </span>
                      <span className={`category-badge text-[9px] ${statusStyles[item.status] ?? "text-ink-muted border-ink-muted"}`}>
                        {statusLabels[item.status] ?? item.status}
                      </span>
                      {item.isImportant && (
                        <span className="category-badge text-[9px] text-destructive border-destructive">重要</span>
                      )}
                      {item.region && <span className="font-sans text-[10px] text-ink-light">{item.region}</span>}
                    </div>
                    <h3
                      className="font-display text-base font-semibold text-foreground group-hover:text-ink-muted transition-colors leading-snug line-clamp-2 mb-2"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="font-sans text-xs text-ink-muted line-clamp-1 mb-2">{item.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4">
                      {item.budget && (
                        <span className="font-sans text-sm font-semibold text-gold">{item.budget}</span>
                      )}
                      {item.publisherName && (
                        <span className="font-sans text-[11px] text-ink-light">{item.publisherName}</span>
                      )}
                      <span className="font-sans text-[11px] text-ink-light">
                        发布：{format(new Date(item.publishedAt), "yyyy-MM-dd")}
                      </span>
                      {item.deadline && (
                        <span className="font-sans text-[11px] text-destructive">
                          截止：{format(new Date(item.deadline), "yyyy-MM-dd")}
                        </span>
                      )}
                    </div>
                  </div>
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
