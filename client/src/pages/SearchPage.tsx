import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, FileText, TrendingUp, Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { format } from "date-fns";

export default function SearchPage() {
  const [query, setQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") ?? "";
  });
  const [inputValue, setInputValue] = useState(query);

  const { data, isLoading } = trpc.search.global.useQuery(
    { keyword: query, limit: 10 },
    { enabled: !!query }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newQuery = inputValue.trim();
    setQuery(newQuery);
    const url = new URL(window.location.href);
    url.searchParams.set("q", newQuery);
    window.history.pushState({}, "", url.toString());
  };

  const totalResults = (data?.news.length ?? 0) + (data?.tenders.length ?? 0) + (data?.manufacturers.length ?? 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Search hero */}
        <div className="border-b border-foreground/10 bg-muted/30">
          <div className="container py-10">
            <div className="editorial-rule-thick mb-6" />
            <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-6"
              style={{ fontFamily: "var(--font-display)" }}>
              全站搜索
            </h1>
            <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-2xl">
              <div className="flex-1 flex items-center gap-3 border-b-2 border-foreground pb-2 focus-within:border-foreground transition-colors">
                <Search size={18} className="text-ink-muted flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="搜索新闻、招投标、厂家..."
                  className="flex-1 bg-transparent font-display text-xl text-foreground placeholder:text-ink-light outline-none"
                  style={{ fontFamily: "var(--font-display)" }}
                />
              </div>
              <button type="submit"
                className="font-sans text-xs tracking-[0.15em] uppercase bg-foreground text-primary-foreground px-5 py-2.5 hover:bg-ink-muted transition-colors flex-shrink-0">
                搜索
              </button>
            </form>
            {query && !isLoading && (
              <p className="font-sans text-xs text-ink-light mt-4">
                "{query}" 共找到 <span className="text-foreground font-semibold">{totalResults}</span> 条结果
              </p>
            )}
          </div>
        </div>

        <div className="container py-8">
          {!query ? (
            <div className="py-16 text-center">
              <Search size={40} className="mx-auto mb-4 text-foreground/10" />
              <p className="font-display text-2xl font-bold text-foreground/20"
                style={{ fontFamily: "var(--font-display)" }}>
                请输入搜索关键词
              </p>
            </div>
          ) : isLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-24" />
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-12 bg-muted rounded" />
                  ))}
                </div>
              ))}
            </div>
          ) : totalResults === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display text-2xl font-bold text-foreground/20 mb-2"
                style={{ fontFamily: "var(--font-display)" }}>
                未找到相关结果
              </p>
              <p className="font-sans text-sm text-ink-light">请尝试其他关键词</p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* News results */}
              {data && data.news.length > 0 && (
                <section>
                  <div className="editorial-rule mb-5">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-ink-muted" />
                      <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold">
                        行业资讯 ({data.news.length})
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0">
                    {data.news.map((item, idx) => (
                      <Link key={item.id} href={`/news/${item.id}`}
                        className={`group flex gap-4 py-4 ${idx < data.news.length - 1 ? "border-b border-foreground/10" : ""} hover:bg-muted/40 transition-colors -mx-2 px-2`}>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-base font-semibold text-foreground group-hover:text-ink-muted transition-colors line-clamp-1"
                            style={{ fontFamily: "var(--font-display)" }}>
                            {item.title}
                          </h3>
                          {item.summary && (
                            <p className="font-sans text-xs text-ink-muted line-clamp-1 mt-1">{item.summary}</p>
                          )}
                          <span className="font-sans text-[10px] text-ink-light mt-1 block">
                            {item.sourceName} · {format(new Date(item.publishedAt), "yyyy-MM-dd")}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href={`/news?keyword=${encodeURIComponent(query)}`}
                    className="font-sans text-xs text-ink-muted hover:text-foreground transition-colors mt-3 inline-block">
                    查看更多资讯结果 →
                  </Link>
                </section>
              )}

              {/* Tender results */}
              {data && data.tenders.length > 0 && (
                <section>
                  <div className="editorial-rule mb-5">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={13} className="text-ink-muted" />
                      <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold">
                        招投标信息 ({data.tenders.length})
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0">
                    {data.tenders.map((item, idx) => (
                      <Link key={item.id} href={`/tenders/${item.id}`}
                        className={`group flex gap-4 py-4 ${idx < data.tenders.length - 1 ? "border-b border-foreground/10" : ""} hover:bg-muted/40 transition-colors -mx-2 px-2`}>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-base font-semibold text-foreground group-hover:text-ink-muted transition-colors line-clamp-1"
                            style={{ fontFamily: "var(--font-display)" }}>
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            {item.budget && <span className="font-sans text-xs text-gold font-semibold">{item.budget}</span>}
                            {item.region && <span className="font-sans text-[10px] text-ink-light">{item.region}</span>}
                            <span className="font-sans text-[10px] text-ink-light">{format(new Date(item.publishedAt), "yyyy-MM-dd")}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href={`/tenders?keyword=${encodeURIComponent(query)}`}
                    className="font-sans text-xs text-ink-muted hover:text-foreground transition-colors mt-3 inline-block">
                    查看更多招投标结果 →
                  </Link>
                </section>
              )}

              {/* Manufacturer results */}
              {data && data.manufacturers.length > 0 && (
                <section>
                  <div className="editorial-rule mb-5">
                    <div className="flex items-center gap-2">
                      <Building2 size={13} className="text-ink-muted" />
                      <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold">
                        企业 ({data.manufacturers.length})
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.manufacturers.map((mfg) => (
                      <Link key={mfg.id} href={`/manufacturers/${mfg.id}`}
                        className="group flex items-center gap-3 p-4 border border-foreground/10 hover:border-foreground/30 transition-colors">
                        <Building2 size={16} className="text-ink-muted flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-sm font-bold text-foreground group-hover:text-ink-muted transition-colors"
                            style={{ fontFamily: "var(--font-display)" }}>
                            {mfg.name}
                          </h3>
                          <p className="font-sans text-[10px] text-ink-light">
                            {mfg.country}{mfg.region ? ` · ${mfg.region}` : ""}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
