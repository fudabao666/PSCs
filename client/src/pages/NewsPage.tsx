import { useState } from "react";
import { Link } from "wouter";
import { Search, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { format } from "date-fns";

const categories = [
  { value: "", label: "全部" },
  { value: "domestic", label: "国内" },
  { value: "international", label: "国际" },
  { value: "research", label: "研究" },
  { value: "policy", label: "政策" },
  { value: "market", label: "市场" },
  { value: "technology", label: "技术" },
];

export default function NewsPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [inputValue, setInputValue] = useState("");

  const { data, isLoading } = trpc.news.list.useQuery({
    page,
    pageSize: 20,
    category: category || undefined,
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
        {/* Page header */}
        <div className="border-b border-foreground/10 bg-muted/30">
          <div className="container py-8">
            <div className="editorial-rule-thick mb-4" />
            <h1 className="font-display text-4xl md:text-5xl font-black text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
              行业资讯
            </h1>
            <p className="font-sans text-sm text-ink-muted">
              汇聚全球钙钛矿光伏行业最新动态 · 每日自动更新
            </p>
          </div>
        </div>

        <div className="container py-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); setPage(1); }}
                  className={`font-sans text-xs tracking-[0.12em] uppercase px-3 py-1.5 border transition-colors ${
                    category === cat.value
                      ? "bg-foreground text-primary-foreground border-foreground"
                      : "border-foreground/20 text-ink-muted hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-2 border-b border-foreground/20 pb-1 focus-within:border-foreground transition-colors">
                <Search size={13} className="text-ink-light" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="搜索新闻..."
                  className="bg-transparent font-sans text-sm text-foreground placeholder:text-ink-light outline-none w-48"
                />
              </div>
              <button type="submit" className="font-sans text-xs tracking-[0.12em] uppercase text-ink-muted hover:text-foreground transition-colors">
                搜索
              </button>
            </form>
          </div>

          {/* Results count */}
          {data && (
            <p className="font-sans text-xs text-ink-light mb-6">
              共 <span className="text-foreground font-semibold">{data.total}</span> 条结果
              {keyword && <span>，关键词："{keyword}"</span>}
            </p>
          )}

          {/* News list */}
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="py-6 border-b border-foreground/10 animate-pulse">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="h-3 bg-muted rounded w-24" />
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                    <div className="w-24 h-20 bg-muted rounded flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-display text-2xl font-bold text-foreground/20 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                暂无资讯
              </p>
              <p className="font-sans text-sm text-ink-light">请尝试其他筛选条件或等待数据更新</p>
            </div>
          ) : (
            <div className="space-y-0">
              {data?.items.map((item, idx) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className={`group flex gap-5 py-6 ${idx < (data?.items.length ?? 0) - 1 ? "border-b border-foreground/10" : ""} hover:bg-muted/40 transition-colors -mx-2 px-2`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`category-badge text-[9px] ${item.category === "domestic" ? "text-foreground border-foreground" : "text-ink-muted border-ink-muted"}`}>
                        {categories.find((c) => c.value === item.category)?.label ?? item.category}
                      </span>
                      {item.isImportant && (
                        <span className="category-badge text-[9px] text-destructive border-destructive">重要</span>
                      )}
                      <span className="font-sans text-[10px] text-ink-light">{item.sourceName}</span>
                      <span className="font-sans text-[10px] text-ink-light">
                        {format(new Date(item.publishedAt), "yyyy-MM-dd")}
                      </span>
                    </div>
                    <h2
                      className="font-display text-lg font-semibold text-foreground group-hover:text-ink-muted transition-colors leading-snug mb-2 line-clamp-2"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {item.title}
                    </h2>
                    {item.summary && (
                      <p className="font-sans text-sm text-ink-muted leading-relaxed line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                  </div>
                  {item.imageUrl && (
                    <div className="w-28 h-20 flex-shrink-0 overflow-hidden bg-muted">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-foreground/20 text-ink-muted hover:border-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const p = page <= 4 ? i + 1 : page - 3 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 font-sans text-xs border transition-colors ${
                      p === page ? "bg-foreground text-primary-foreground border-foreground" : "border-foreground/20 text-ink-muted hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-foreground/20 text-ink-muted hover:border-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
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
