import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, TrendingUp, FileText, Building2, Zap, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const categoryLabels: Record<string, { label: string; color: string }> = {
  domestic: { label: "国内", color: "text-foreground" },
  international: { label: "国际", color: "text-ink-muted" },
  research: { label: "研究", color: "text-ink-muted" },
  policy: { label: "政策", color: "text-ink-muted" },
  market: { label: "市场", color: "text-ink-muted" },
  technology: { label: "技术", color: "text-ink-muted" },
};

const tenderTypeLabels: Record<string, string> = {
  procurement: "设备采购",
  construction: "工程建设",
  research: "研究合作",
  service: "服务外包",
  other: "其他",
};

export default function Home() {
  const { data: latestNews, isLoading: newsLoading } = trpc.news.latest.useQuery({ limit: 8 });
  const { data: latestTenders, isLoading: tendersLoading } = trpc.tenders.latest.useQuery({ limit: 5 });
  const { data: stats } = trpc.stats.site.useQuery();
  const { data: currentRecords } = trpc.efficiency.current.useQuery();

  const featuredNews = latestNews?.[0];
  const secondaryNews = latestNews?.slice(1, 4) ?? [];
  const sideNews = latestNews?.slice(4, 8) ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Breaking news ticker */}
      <div className="bg-foreground text-primary-foreground py-2 overflow-hidden">
        <div className="container flex items-center gap-4">
          <span className="font-sans text-[10px] tracking-[0.2em] uppercase bg-primary-foreground text-foreground px-2 py-0.5 flex-shrink-0 font-semibold">
            最新
          </span>
          <div className="overflow-hidden flex-1">
            <div className="ticker-animate gap-16">
              {latestNews?.map((n) => (
                <Link key={n.id} href={`/news/${n.id}`} className="font-sans text-xs text-primary-foreground/80 hover:text-primary-foreground mr-16 transition-colors">
                  {n.title}
                </Link>
              ))}
              {latestNews?.map((n) => (
                <Link key={`dup-${n.id}`} href={`/news/${n.id}`} className="font-sans text-xs text-primary-foreground/80 hover:text-primary-foreground mr-16 transition-colors">
                  {n.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Hero section */}
        <section className="container py-8 md:py-12">
          {/* Section header */}
          <div className="editorial-rule mb-6">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-ink-muted font-semibold">
                今日要闻
              </span>
              <Link href="/news" className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted hover:text-foreground transition-colors flex items-center gap-1">
                查看全部 <ArrowRight size={10} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8">
            {/* Featured article */}
            <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-foreground/10 pb-8 lg:pb-0 lg:pr-8">
              {newsLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-64 bg-muted rounded" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ) : featuredNews ? (
                <Link href={`/news/${featuredNews.id}`} className="group block">
                  {featuredNews.imageUrl && (
                    <div className="aspect-[16/9] overflow-hidden mb-5 bg-muted">
                      <img
                        src={featuredNews.imageUrl}
                        alt={featuredNews.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="category-badge text-foreground border-foreground">
                      {categoryLabels[featuredNews.category]?.label ?? featuredNews.category}
                    </span>
                    {featuredNews.isImportant && (
                      <span className="category-badge text-destructive border-destructive">重要</span>
                    )}
                    <span className="font-sans text-[10px] text-ink-light">
                      {featuredNews.sourceName}
                    </span>
                  </div>
                  <h2
                    className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-foreground group-hover:text-ink-muted transition-colors mb-4"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {featuredNews.title}
                  </h2>
                  {featuredNews.summary && (
                    <p className="font-serif text-base text-ink-muted leading-relaxed line-clamp-3" style={{ fontFamily: "var(--font-serif)" }}>
                      {featuredNews.summary}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-ink-light">
                    <span className="font-sans text-[11px]">
                      {format(new Date(featuredNews.publishedAt), "yyyy年MM月dd日", { locale: zhCN })}
                    </span>
                    <span className="font-sans text-[11px] flex items-center gap-1 text-foreground group-hover:gap-2 transition-all">
                      阅读全文 <ArrowRight size={10} />
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-ink-light">
                  <FileText size={32} className="mb-3 opacity-30" />
                  <p className="font-sans text-sm">暂无新闻，请等待数据更新</p>
                </div>
              )}
            </div>

            {/* Secondary articles */}
            <div className="lg:col-span-5 pt-8 lg:pt-0">
              <div className="space-y-0">
                {secondaryNews.map((item, idx) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.id}`}
                    className={`group flex gap-4 py-5 ${idx < secondaryNews.length - 1 ? "border-b border-foreground/10" : ""} hover:bg-muted/50 transition-colors -mx-2 px-2`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="category-badge text-ink-muted border-ink-muted text-[9px]">
                          {categoryLabels[item.category]?.label ?? item.category}
                        </span>
                        <span className="font-sans text-[10px] text-ink-light">
                          {format(new Date(item.publishedAt), "MM/dd", { locale: zhCN })}
                        </span>
                      </div>
                      <h3
                        className="font-display text-base font-semibold leading-snug text-foreground group-hover:text-ink-muted transition-colors line-clamp-2"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {item.title}
                      </h3>
                      {item.summary && (
                        <p className="font-sans text-xs text-ink-light mt-1.5 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      )}
                    </div>
                    {item.imageUrl && (
                      <div className="w-20 h-16 flex-shrink-0 overflow-hidden bg-muted">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </Link>
                ))}

                {secondaryNews.length === 0 && !newsLoading && (
                  <div className="py-8 text-center text-ink-light">
                    <p className="font-sans text-sm">暂无更多新闻</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="bg-foreground text-primary-foreground py-8">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-primary-foreground/10">
              {[
                { icon: FileText, label: "新闻资讯", value: stats?.newsCount ?? 0, unit: "条", href: "/news" },
                { icon: TrendingUp, label: "招投标信息", value: stats?.tenderCount ?? 0, unit: "条", href: "/tenders" },
                { icon: Building2, label: "全球厂家", value: stats?.manufacturerCount ?? 0, unit: "家", href: "/manufacturers" },
                { icon: Zap, label: "最高效率记录", value: currentRecords?.[0] ? `${currentRecords[0].efficiency}%` : "—", unit: "", href: "/efficiency" },
              ].map((stat) => (
                <Link key={stat.label} href={stat.href} className="group flex flex-col items-center md:items-start md:px-8 gap-1">
                  <stat.icon size={16} className="text-primary-foreground/40 mb-1" />
                  <div className="flex items-baseline gap-1">
                    <span
                      className="font-display text-3xl font-black text-primary-foreground"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {stat.value}
                    </span>
                    {stat.unit && <span className="font-sans text-xs text-primary-foreground/60">{stat.unit}</span>}
                  </div>
                  <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-primary-foreground/40 group-hover:text-primary-foreground/70 transition-colors">
                    {stat.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Tenders + Side news */}
        <section className="container py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Tenders */}
            <div className="lg:col-span-7">
              <div className="editorial-rule mb-6">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-ink-muted font-semibold">
                    最新招投标
                  </span>
                  <Link href="/tenders" className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted hover:text-foreground transition-colors flex items-center gap-1">
                    查看全部 <ArrowRight size={10} />
                  </Link>
                </div>
              </div>

              <div className="space-y-0">
                {tendersLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="py-4 border-b border-foreground/10 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))
                ) : latestTenders && latestTenders.length > 0 ? (
                  latestTenders.map((tender, idx) => (
                    <Link
                      key={tender.id}
                      href={`/tenders/${tender.id}`}
                      className={`group flex items-start gap-4 py-5 ${idx < latestTenders.length - 1 ? "border-b border-foreground/10" : ""} hover:bg-muted/50 transition-colors -mx-2 px-2`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 border border-foreground/20 flex items-center justify-center mt-0.5">
                        <span className="font-display text-sm font-bold text-ink-muted" style={{ fontFamily: "var(--font-display)" }}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="category-badge text-ink-muted border-ink-muted text-[9px]">
                            {tenderTypeLabels[tender.projectType] ?? tender.projectType}
                          </span>
                          {tender.isImportant && (
                            <span className="category-badge text-destructive border-destructive text-[9px]">重要</span>
                          )}
                          {tender.region && (
                            <span className="font-sans text-[10px] text-ink-light">{tender.region}</span>
                          )}
                        </div>
                        <h3
                          className="font-display text-base font-semibold leading-snug text-foreground group-hover:text-ink-muted transition-colors line-clamp-2"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {tender.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          {tender.budget && (
                            <span className="font-sans text-xs text-gold font-semibold">{tender.budget}</span>
                          )}
                          {tender.publisherName && (
                            <span className="font-sans text-[11px] text-ink-light">{tender.publisherName}</span>
                          )}
                          <span className="font-sans text-[11px] text-ink-light">
                            {format(new Date(tender.publishedAt), "yyyy-MM-dd")}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-12 text-center text-ink-light">
                    <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-sans text-sm">暂无招投标信息</p>
                  </div>
                )}
              </div>
            </div>

            {/* Side: more news + efficiency */}
            <div className="lg:col-span-5 space-y-10">
              {/* More news */}
              <div>
                <div className="editorial-rule mb-5">
                  <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-ink-muted font-semibold">
                    更多资讯
                  </span>
                </div>
                <div className="space-y-0">
                  {sideNews.map((item, idx) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.id}`}
                      className={`group flex items-start gap-3 py-3.5 ${idx < sideNews.length - 1 ? "border-b border-foreground/10" : ""} hover:bg-muted/50 transition-colors -mx-2 px-2`}
                    >
                      <span
                        className="font-display text-xl font-black text-foreground/10 leading-none mt-0.5 w-6 flex-shrink-0"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-sans text-sm font-medium text-foreground group-hover:text-ink-muted transition-colors line-clamp-2 leading-snug"
                        >
                          {item.title}
                        </h4>
                        <span className="font-sans text-[10px] text-ink-light mt-1 block">
                          {format(new Date(item.publishedAt), "MM月dd日")} · {item.sourceName}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Efficiency snapshot */}
              {currentRecords && currentRecords.length > 0 && (
                <div>
                  <div className="editorial-rule mb-5">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-ink-muted font-semibold">
                        效率记录
                      </span>
                      <Link href="/efficiency" className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted hover:text-foreground transition-colors flex items-center gap-1">
                        详情 <ArrowRight size={10} />
                      </Link>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {currentRecords.slice(0, 3).map((rec) => {
                      const typeLabels: Record<string, string> = {
                        single_junction: "单结",
                        tandem_silicon: "钙钛矿/硅叠层",
                        tandem_perovskite: "全钙钛矿叠层",
                        flexible: "柔性",
                        module: "组件",
                        mini_module: "小组件",
                      };
                      return (
                        <div key={rec.id} className="flex items-center justify-between py-3 border-b border-foreground/10">
                          <div>
                            <p className="font-sans text-xs font-medium text-foreground">{typeLabels[rec.cellType] ?? rec.cellType}</p>
                            <p className="font-sans text-[10px] text-ink-light mt-0.5">{rec.institution}</p>
                          </div>
                          <div className="text-right">
                            <span
                              className="font-display text-xl font-black text-foreground"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {rec.efficiency}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Manufacturers preview */}
        <section className="bg-muted py-10 md:py-14">
          <div className="container">
            <div className="editorial-rule mb-8">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-ink-muted font-semibold">
                  全球主要厂家
                </span>
                <Link href="/manufacturers" className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted hover:text-foreground transition-colors flex items-center gap-1">
                  查看完整数据库 <ArrowRight size={10} />
                </Link>
              </div>
            </div>

            <ManufacturersPreview />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function ManufacturersPreview() {
  const { data } = trpc.manufacturers.list.useQuery({ pageSize: 8 });

  const stageLabels: Record<string, string> = {
    research: "研发阶段",
    pilot: "中试阶段",
    mass_production: "量产阶段",
    listed: "已上市",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data?.items.map((mfg) => (
        <Link
          key={mfg.id}
          href={`/manufacturers/${mfg.id}`}
          className="group bg-card border border-foreground/10 p-5 hover:border-foreground/30 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 bg-foreground/5 flex items-center justify-center">
              <Building2 size={14} className="text-ink-muted" />
            </div>
            <span className="category-badge text-[8px] text-ink-light border-ink-light">
              {stageLabels[mfg.stage] ?? mfg.stage}
            </span>
          </div>
          <h3
            className="font-display text-sm font-bold text-foreground group-hover:text-ink-muted transition-colors leading-snug mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {mfg.name}
          </h3>
          <p className="font-sans text-[10px] text-ink-light">{mfg.country}{mfg.region ? ` · ${mfg.region}` : ""}</p>
          {mfg.foundedYear && (
            <p className="font-sans text-[10px] text-ink-light mt-0.5">成立于 {mfg.foundedYear}</p>
          )}
        </Link>
      ))}

      {(!data?.items || data.items.length === 0) && (
        <div className="col-span-4 py-12 text-center text-ink-light">
          <Building2 size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-sans text-sm">厂家数据库正在初始化中</p>
          <p className="font-sans text-xs mt-1 text-ink-light">请管理员添加厂家信息或触发数据更新</p>
        </div>
      )}
    </div>
  );
}
