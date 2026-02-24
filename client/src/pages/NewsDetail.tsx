import { Link, useParams } from "wouter";
import { ArrowLeft, ExternalLink, Calendar, Tag } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { format } from "date-fns";

const categoryLabels: Record<string, string> = {
  domestic: "国内", international: "国际", research: "研究",
  policy: "政策", market: "市场", technology: "技术",
};

export default function NewsDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");
  const { data: article, isLoading } = trpc.news.byId.useQuery({ id }, { enabled: !!id });
  const { data: relatedNews } = trpc.news.latest.useQuery({ limit: 5 });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="container py-12 animate-pulse space-y-4 flex-1">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-40 bg-muted rounded" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="container py-20 text-center flex-1">
          <p className="font-display text-3xl font-bold text-foreground/20 mb-3" style={{ fontFamily: "var(--font-display)" }}>文章不存在</p>
          <Link href="/news" className="font-sans text-sm text-ink-muted hover:text-foreground transition-colors flex items-center gap-1 justify-center">
            <ArrowLeft size={14} /> 返回资讯列表
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-8">
          {/* Back */}
          <Link href="/news" className="inline-flex items-center gap-1.5 font-sans text-xs tracking-[0.12em] uppercase text-ink-muted hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={12} /> 行业资讯
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Main content */}
            <article className="lg:col-span-8">
              {/* Category + meta */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="category-badge text-foreground border-foreground">
                  {categoryLabels[article.category] ?? article.category}
                </span>
                {article.isImportant && (
                  <span className="category-badge text-destructive border-destructive">重要</span>
                )}
                <span className="font-sans text-[11px] text-ink-light flex items-center gap-1">
                  <Calendar size={10} />
                  {format(new Date(article.publishedAt), "yyyy年MM月dd日")}
                </span>
                {article.sourceName && (
                  <span className="font-sans text-[11px] text-ink-light">来源：{article.sourceName}</span>
                )}
              </div>

              {/* Title */}
              <h1
                className="font-display text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {article.title}
              </h1>

              <div className="editorial-rule-thin mb-6" />

              {/* Image */}
              {article.imageUrl && (
                <div className="aspect-[16/9] overflow-hidden bg-muted mb-6">
                  <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Summary */}
              {article.summary && (
                <blockquote className="border-l-2 border-foreground pl-5 mb-6">
                  <p className="font-serif text-lg text-ink-muted leading-relaxed italic" style={{ fontFamily: "var(--font-serif)" }}>
                    {article.summary}
                  </p>
                </blockquote>
              )}

              {/* Content */}
              {article.content && (
                <div className="prose prose-sm max-w-none">
                  <div className="font-sans text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {article.content}
                  </div>
                </div>
              )}

              {/* Tags */}
              {article.tags && (
                <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-foreground/10">
                  <Tag size={12} className="text-ink-light" />
                  {JSON.parse(article.tags).map((tag: string) => (
                    <span key={tag} className="font-sans text-[10px] tracking-wide px-2 py-0.5 bg-muted text-ink-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Source link */}
              {article.sourceUrl && (
                <div className="mt-6 pt-6 border-t border-foreground/10">
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.12em] uppercase border border-foreground/20 px-4 py-2 text-ink-muted hover:border-foreground hover:text-foreground transition-colors"
                  >
                    查看原文 <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24">
                <div className="editorial-rule mb-5">
                  <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold">
                    最新资讯
                  </span>
                </div>
                <div className="space-y-0">
                  {relatedNews?.filter((n) => n.id !== article.id).slice(0, 4).map((item, idx) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.id}`}
                      className={`group block py-4 ${idx < 3 ? "border-b border-foreground/10" : ""} hover:bg-muted/40 transition-colors -mx-2 px-2`}
                    >
                      <span className="font-sans text-[10px] text-ink-light block mb-1">
                        {format(new Date(item.publishedAt), "MM月dd日")}
                      </span>
                      <h4
                        className="font-sans text-sm font-medium text-foreground group-hover:text-ink-muted transition-colors line-clamp-2 leading-snug"
                      >
                        {item.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
