import { Link, useParams } from "wouter";
import { ArrowLeft, ExternalLink, Globe, Calendar, MapPin, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { format } from "date-fns";

const stageLabels: Record<string, string> = {
  research: "研发阶段", pilot: "中试阶段",
  mass_production: "量产阶段", listed: "已上市",
};

export default function ManufacturerDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");
  const { data: mfg, isLoading } = trpc.manufacturers.byId.useQuery({ id }, { enabled: !!id });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="container py-12 animate-pulse space-y-4 flex-1">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-40 bg-muted rounded" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!mfg) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="container py-20 text-center flex-1">
          <p className="font-display text-3xl font-bold text-foreground/20 mb-3" style={{ fontFamily: "var(--font-display)" }}>企业不存在</p>
          <Link href="/manufacturers" className="font-sans text-sm text-ink-muted hover:text-foreground transition-colors inline-flex items-center gap-1">
            <ArrowLeft size={14} /> 返回厂家数据库
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  let mainProducts: string[] = [];
  let techAchievements: Array<{ title: string; value?: string; date?: string; description?: string }> = [];

  try { mainProducts = JSON.parse(mfg.mainProducts ?? "[]"); } catch { mainProducts = []; }
  try { techAchievements = JSON.parse(mfg.techAchievements ?? "[]"); } catch { techAchievements = []; }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-8">
          <Link href="/manufacturers" className="inline-flex items-center gap-1.5 font-sans text-xs tracking-[0.12em] uppercase text-ink-muted hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={12} /> 厂家数据库
          </Link>

          {/* Company header */}
          <div className="border-b border-foreground/10 pb-8 mb-8">
            <div className="flex items-start gap-6">
              {mfg.logoUrl && (
                <div className="w-16 h-16 border border-foreground/10 flex items-center justify-center flex-shrink-0 bg-white">
                  <img src={mfg.logoUrl} alt={mfg.name} className="w-full h-full object-contain p-2" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="category-badge text-ink-muted border-ink-muted">
                    {stageLabels[mfg.stage] ?? mfg.stage}
                  </span>
                  {mfg.stockCode && (
                    <span className="font-sans text-xs text-gold font-semibold border border-gold/40 px-2 py-0.5">
                      {mfg.stockCode}
                    </span>
                  )}
                  {!mfg.isActive && (
                    <span className="category-badge text-destructive border-destructive">已停止运营</span>
                  )}
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-black text-foreground leading-tight mb-1"
                  style={{ fontFamily: "var(--font-display)" }}>
                  {mfg.name}
                </h1>
                {mfg.nameEn && (
                  <p className="font-sans text-sm text-ink-muted mb-3">{mfg.nameEn}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-ink-light">
                  {(mfg.country || mfg.region) && (
                    <span className="font-sans text-xs flex items-center gap-1">
                      <MapPin size={11} /> {mfg.country}{mfg.region ? ` · ${mfg.region}` : ""}
                    </span>
                  )}
                  {mfg.foundedYear && (
                    <span className="font-sans text-xs flex items-center gap-1">
                      <Calendar size={11} /> 成立于 {mfg.foundedYear}
                    </span>
                  )}
                  {mfg.website && (
                    <a href={mfg.website} target="_blank" rel="noopener noreferrer"
                      className="font-sans text-xs flex items-center gap-1 hover:text-foreground transition-colors">
                      <Globe size={11} /> 官方网站 <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8 space-y-8">
              {/* Description */}
              {mfg.description && (
                <div>
                  <h2 className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold mb-3">公司简介</h2>
                  <p className="font-serif text-base text-foreground leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
                    {mfg.description}
                  </p>
                </div>
              )}

              {/* Main products */}
              {mainProducts.length > 0 && (
                <div>
                  <h2 className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold mb-3">主要产品</h2>
                  <div className="flex flex-wrap gap-2">
                    {mainProducts.map((p, i) => (
                      <span key={i} className="font-sans text-xs px-3 py-1.5 bg-muted border border-foreground/10 text-foreground">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tech achievements */}
              {techAchievements.length > 0 && (
                <div>
                  <h2 className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold mb-4">技术成就</h2>
                  <div className="space-y-0">
                    {techAchievements.map((ach, i) => (
                      <div key={i} className={`flex gap-4 py-4 ${i < techAchievements.length - 1 ? "border-b border-foreground/10" : ""}`}>
                        <div className="flex-shrink-0 mt-1">
                          <Zap size={14} className="text-gold" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-sans text-sm font-semibold text-foreground">{ach.title}</h3>
                            {ach.value && (
                              <span className="font-display text-lg font-black text-gold flex-shrink-0"
                                style={{ fontFamily: "var(--font-display)" }}>
                                {ach.value}
                              </span>
                            )}
                          </div>
                          {ach.description && (
                            <p className="font-sans text-xs text-ink-muted mt-1">{ach.description}</p>
                          )}
                          {ach.date && (
                            <p className="font-sans text-[10px] text-ink-light mt-1">{ach.date}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest news */}
              {mfg.latestNews && (
                <div>
                  <h2 className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold mb-3">最新动态</h2>
                  <p className="font-sans text-sm text-foreground leading-relaxed">{mfg.latestNews}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="bg-muted p-6 space-y-4">
                <h3 className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold border-b border-foreground/10 pb-3">
                  企业信息
                </h3>
                {[
                  { label: "国家/地区", value: `${mfg.country ?? ""}${mfg.region ? " · " + mfg.region : ""}` },
                  { label: "成立年份", value: mfg.foundedYear?.toString() },
                  { label: "发展阶段", value: stageLabels[mfg.stage] },
                  { label: "股票代码", value: mfg.stockCode },
                  { label: "产能信息", value: mfg.capacity },
                ].filter((item) => item.value).map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-2">
                    <span className="font-sans text-[10px] text-ink-light">{item.label}</span>
                    <span className="font-sans text-xs text-foreground text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
