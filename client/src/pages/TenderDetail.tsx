import { Link, useParams } from "wouter";
import { ArrowLeft, ExternalLink, Calendar, MapPin, Building, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { format } from "date-fns";

const statusStyles: Record<string, { cls: string; label: string }> = {
  open: { cls: "bg-emerald-100 text-emerald-800 border-emerald-300", label: "招标中" },
  closed: { cls: "bg-muted text-ink-muted border-border", label: "已截止" },
  awarded: { cls: "bg-blue-50 text-blue-800 border-blue-200", label: "已中标" },
  cancelled: { cls: "bg-red-50 text-red-700 border-red-200", label: "已取消" },
};

const typeLabels: Record<string, string> = {
  procurement: "设备采购", construction: "工程建设",
  research: "研究合作", service: "服务外包", other: "其他",
};

export default function TenderDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");
  const { data: tender, isLoading } = trpc.tenders.byId.useQuery({ id }, { enabled: !!id });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="container py-12 animate-pulse space-y-4 flex-1">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-40 bg-muted rounded" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="container py-20 text-center flex-1">
          <p className="font-display text-3xl font-bold text-foreground/20 mb-3" style={{ fontFamily: "var(--font-display)" }}>
            招投标信息不存在
          </p>
          <Link href="/tenders" className="font-sans text-sm text-ink-muted hover:text-foreground transition-colors inline-flex items-center gap-1">
            <ArrowLeft size={14} /> 返回招投标列表
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const statusInfo = statusStyles[tender.status] ?? statusStyles.closed;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-8">
          <Link href="/tenders" className="inline-flex items-center gap-1.5 font-sans text-xs tracking-[0.12em] uppercase text-ink-muted hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={12} /> 招投标专区
          </Link>

          {tender.isImportant && (
            <div className="bg-destructive/5 border border-destructive/20 px-4 py-3 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="font-sans text-xs text-destructive font-semibold tracking-wide">重要招标信息</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="category-badge text-ink-muted border-ink-muted">
                  {typeLabels[tender.projectType] ?? tender.projectType}
                </span>
                <span className={`category-badge text-xs border ${statusInfo.cls}`}>
                  {statusInfo.label}
                </span>
              </div>

              {/* Title */}
              <h1
                className="font-display text-3xl md:text-4xl font-black text-foreground leading-tight mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {tender.title}
              </h1>

              <div className="editorial-rule-thin mb-6" />

              {/* Description */}
              {tender.description && (
                <div className="mb-8">
                  <h2 className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold mb-3">项目描述</h2>
                  <p className="font-serif text-base text-foreground leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "var(--font-serif)" }}>
                    {tender.description}
                  </p>
                </div>
              )}

              {/* Contact */}
              {tender.contactInfo && (
                <div className="mb-8">
                  <h2 className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold mb-3">联系方式</h2>
                  <p className="font-sans text-sm text-foreground leading-relaxed whitespace-pre-wrap">{tender.contactInfo}</p>
                </div>
              )}

              {/* Source link */}
              {tender.sourceUrl && (
                <a
                  href={tender.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.12em] uppercase border border-foreground/20 px-4 py-2 text-ink-muted hover:border-foreground hover:text-foreground transition-colors"
                >
                  查看原始公告 <ExternalLink size={11} />
                </a>
              )}
            </div>

            {/* Info sidebar */}
            <aside className="lg:col-span-4">
              <div className="bg-muted p-6 space-y-5">
                <h3 className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold border-b border-foreground/10 pb-3">
                  项目信息
                </h3>

                {tender.budget && (
                  <div className="flex items-start gap-3">
                    <DollarSign size={14} className="text-ink-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-sans text-[10px] text-ink-light mb-0.5">预算金额</p>
                      <p className="font-display text-xl font-bold text-gold" style={{ fontFamily: "var(--font-display)" }}>
                        {tender.budget}
                      </p>
                    </div>
                  </div>
                )}

                {tender.region && (
                  <div className="flex items-start gap-3">
                    <MapPin size={14} className="text-ink-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-sans text-[10px] text-ink-light mb-0.5">项目地区</p>
                      <p className="font-sans text-sm text-foreground">{tender.region}</p>
                    </div>
                  </div>
                )}

                {tender.publisherName && (
                  <div className="flex items-start gap-3">
                    <Building size={14} className="text-ink-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-sans text-[10px] text-ink-light mb-0.5">招标方</p>
                      <p className="font-sans text-sm text-foreground">{tender.publisherName}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar size={14} className="text-ink-light mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-sans text-[10px] text-ink-light mb-0.5">发布日期</p>
                    <p className="font-sans text-sm text-foreground">
                      {format(new Date(tender.publishedAt), "yyyy年MM月dd日")}
                    </p>
                  </div>
                </div>

                {tender.deadline && (
                  <div className="flex items-start gap-3">
                    <Calendar size={14} className="text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-sans text-[10px] text-ink-light mb-0.5">截止日期</p>
                      <p className="font-sans text-sm text-destructive font-semibold">
                        {format(new Date(tender.deadline), "yyyy年MM月dd日")}
                      </p>
                    </div>
                  </div>
                )}

                {tender.sourcePlatform && (
                  <div className="pt-3 border-t border-foreground/10">
                    <p className="font-sans text-[10px] text-ink-light mb-0.5">信息来源平台</p>
                    <p className="font-sans text-xs text-foreground">{tender.sourcePlatform}</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
