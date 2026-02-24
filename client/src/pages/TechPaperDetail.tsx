import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
  ExternalLink,
  Star,
  Tag,
  Users,
  Lightbulb,
} from "lucide-react";

const RESEARCH_TYPE_LABELS: Record<string, string> = {
  efficiency: "效率突破",
  stability: "稳定性",
  materials: "材料创新",
  fabrication: "制备工艺",
  tandem: "叠层电池",
  flexible: "柔性器件",
  commercialization: "商业化",
  other: "其他",
};

const RESEARCH_TYPE_COLORS: Record<string, string> = {
  efficiency: "bg-amber-100 text-amber-800 border-amber-200",
  stability: "bg-green-100 text-green-800 border-green-200",
  materials: "bg-purple-100 text-purple-800 border-purple-200",
  fabrication: "bg-blue-100 text-blue-800 border-blue-200",
  tandem: "bg-red-100 text-red-800 border-red-200",
  flexible: "bg-cyan-100 text-cyan-800 border-cyan-200",
  commercialization: "bg-orange-100 text-orange-800 border-orange-200",
  other: "bg-stone-100 text-stone-700 border-stone-200",
};

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

export default function TechPaperDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);

  const { data: paper, isLoading, error } = trpc.tech.papers.byId.useQuery(
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

  if (error || !paper) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F4]">
        <SiteHeader />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-stone-500 text-lg">论文不存在或已删除</p>
          <Link href="/tech">
            <Button variant="outline" className="mt-4">返回技术前沿</Button>
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const authors = parseJsonArray(paper.authors);
  const institutions = parseJsonArray(paper.institutions);
  const keyFindings = parseJsonArray(paper.keyFindings);
  const tags = parseJsonArray(paper.tags);
  const typeColor = RESEARCH_TYPE_COLORS[paper.researchType] ?? RESEARCH_TYPE_COLORS.other;
  const typeLabel = RESEARCH_TYPE_LABELS[paper.researchType] ?? paper.researchType;

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

        {/* Article */}
        <article className="bg-white border border-stone-200 rounded-xl p-8 md:p-12">
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${typeColor}`}>
              {typeLabel}
            </span>
            {paper.isHighlight && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                重点论文
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 leading-tight mb-3">
            {paper.title}
          </h1>
          {paper.titleEn && (
            <p className="text-stone-500 text-base italic mb-6">{paper.titleEn}</p>
          )}

          {/* Summary box */}
          {paper.summary && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">AI 摘要</span>
              </div>
              <p className="text-amber-900 text-sm leading-relaxed">{paper.summary}</p>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-sm">
            {paper.journal && (
              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-stone-400 text-xs block mb-0.5">期刊</span>
                  <span className="text-stone-800 font-medium italic">{paper.journal}</span>
                </div>
              </div>
            )}
            {paper.doi && (
              <div className="flex items-start gap-3">
                <ExternalLink className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-stone-400 text-xs block mb-0.5">DOI</span>
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-700 hover:text-stone-900 underline font-mono text-xs"
                  >
                    {paper.doi}
                  </a>
                </div>
              </div>
            )}
            {authors.length > 0 && (
              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-stone-400 text-xs block mb-0.5">作者</span>
                  <span className="text-stone-700">{authors.join("、")}</span>
                </div>
              </div>
            )}
            {institutions.length > 0 && (
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-stone-400 text-xs block mb-0.5">机构</span>
                  <span className="text-stone-700">{institutions.join("、")}</span>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-stone-400 text-xs block mb-0.5">发表日期</span>
                <span className="text-stone-700">
                  {new Date(paper.publishedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Key findings */}
          {keyFindings.length > 0 && (
            <div className="mb-8">
              <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-amber-500 rounded-full inline-block" />
                核心发现
              </h2>
              <ul className="space-y-2.5">
                {keyFindings.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-stone-700 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Abstract */}
          {paper.abstract && (
            <div className="mb-8">
              <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-stone-400 rounded-full inline-block" />
                摘要
              </h2>
              <p className="text-stone-600 leading-relaxed text-sm">{paper.abstract}</p>
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

          {/* Source link */}
          {paper.sourceUrl && (
            <div className="mt-6 pt-6 border-t border-stone-100">
              <a
                href={paper.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 underline"
              >
                <ExternalLink className="w-4 h-4" />
                查看原文
              </a>
            </div>
          )}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
