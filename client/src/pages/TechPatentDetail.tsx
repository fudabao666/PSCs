import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ExternalLink,
  Star,
  Tag,
  Users,
  Shield,
  Hash,
  Globe,
  Lightbulb,
} from "lucide-react";

const PATENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  granted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-stone-100 text-stone-600 border-stone-200",
};

const PATENT_STATUS_LABELS: Record<string, string> = {
  pending: "审查中",
  granted: "已授权",
  rejected: "已驳回",
  expired: "已失效",
};

const PATENT_TYPE_LABELS: Record<string, string> = {
  invention: "发明专利",
  utility: "实用新型",
  design: "外观设计",
  pct: "PCT国际专利",
};

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

export default function TechPatentDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);

  const { data: patent, isLoading, error } = trpc.tech.patents.byId.useQuery(
    { id },
    { enabled: id > 0 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F4]">
        <SiteHeader />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-16">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-stone-200 rounded w-3/4" />
            <div className="h-4 bg-stone-100 rounded w-1/2" />
            <div className="h-48 bg-stone-100 rounded" />
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error || !patent) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F4]">
        <SiteHeader />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-stone-500 text-lg">专利不存在或已删除</p>
          <Link href="/tech">
            <Button variant="outline" className="mt-4">返回技术前沿</Button>
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const applicants = parseJsonArray(patent.applicants);
  const inventors = parseJsonArray(patent.inventors);
  const tags = parseJsonArray(patent.tags);
  const statusColor = PATENT_STATUS_COLORS[patent.status] ?? PATENT_STATUS_COLORS.pending;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4]">
      <SiteHeader />

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-10">
        {/* Back */}
        <Link href="/tech">
          <button className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            返回技术前沿
          </button>
        </Link>

        <article className="bg-white border border-stone-200 rounded-xl p-8 md:p-12">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor}`}>
              {PATENT_STATUS_LABELS[patent.status]}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full border bg-stone-100 text-stone-600 border-stone-200">
              {PATENT_TYPE_LABELS[patent.patentType]}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full border bg-stone-50 text-stone-500 border-stone-200 font-mono">
              {patent.country}
            </span>
            {patent.isHighlight && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                重点专利
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 leading-tight mb-3">
            {patent.title}
          </h1>
          {patent.titleEn && (
            <p className="text-stone-500 text-base italic mb-6">{patent.titleEn}</p>
          )}

          {/* Summary */}
          {patent.summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">AI 摘要</span>
              </div>
              <p className="text-blue-900 text-sm leading-relaxed">{patent.summary}</p>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-sm">
            {patent.patentNumber && (
              <div className="flex items-start gap-3">
                <Hash className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-stone-400 text-xs block mb-0.5">专利号</span>
                  <span className="text-stone-800 font-mono">{patent.patentNumber}</span>
                </div>
              </div>
            )}
            {patent.ipcCode && (
              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-stone-400 text-xs block mb-0.5">IPC分类号</span>
                  <span className="text-stone-700 font-mono">{patent.ipcCode}</span>
                </div>
              </div>
            )}
            {applicants.length > 0 && (
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-stone-400 text-xs block mb-0.5">申请人</span>
                  <span className="text-stone-700">{applicants.join("、")}</span>
                </div>
              </div>
            )}
            {inventors.length > 0 && (
              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-stone-400 text-xs block mb-0.5">发明人</span>
                  <span className="text-stone-700">{inventors.join("、")}</span>
                </div>
              </div>
            )}
            {patent.filedAt && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-stone-400 text-xs block mb-0.5">申请日期</span>
                  <span className="text-stone-700">
                    {new Date(patent.filedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-stone-400 text-xs block mb-0.5">专利国家/地区</span>
                <span className="text-stone-700">{patent.country}</span>
              </div>
            </div>
          </div>

          {/* Abstract */}
          {patent.abstract && (
            <div className="mb-8">
              <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-stone-400 rounded-full inline-block" />
                专利摘要
              </h2>
              <p className="text-stone-600 leading-relaxed text-sm">{patent.abstract}</p>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-stone-100">
              <Tag className="w-3.5 h-3.5 text-stone-400" />
              {tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Source */}
          {patent.sourceUrl && (
            <div className="mt-6 pt-6 border-t border-stone-100">
              <a
                href={patent.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 underline"
              >
                <ExternalLink className="w-4 h-4" />
                查看专利原文
              </a>
            </div>
          )}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
