import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FlaskConical,
  Search,
  ExternalLink,
  Star,
  BookOpen,
  Shield,
  ChevronRight,
  Calendar,
  Building2,
  Tag,
} from "lucide-react";

const RESEARCH_TYPES = [
  { value: "all", label: "全部" },
  { value: "efficiency", label: "效率突破" },
  { value: "stability", label: "稳定性" },
  { value: "materials", label: "材料创新" },
  { value: "fabrication", label: "制备工艺" },
  { value: "tandem", label: "叠层电池" },
  { value: "flexible", label: "柔性器件" },
  { value: "commercialization", label: "商业化" },
  { value: "other", label: "其他" },
];

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

const PATENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  granted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-stone-100 text-stone-600 border-stone-200",
};

const PATENT_STATUS_LABELS: Record<string, string> = {
  pending: "审中",
  granted: "已授权",
  rejected: "驳回",
  expired: "失效",
};

const PATENT_TYPE_LABELS: Record<string, string> = {
  invention: "发明专利",
  utility: "实用新型",
  design: "外观设计",
  pct: "PCT国际",
};

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

export default function TechPage() {
  const [activeTab, setActiveTab] = useState<"papers" | "patents">("papers");
  const [paperType, setPaperType] = useState("all");
  const [patentCountry, setPatentCountry] = useState("all");
  const [patentStatus, setPatentStatus] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [paperOffset, setPaperOffset] = useState(0);
  const [patentOffset, setPatentOffset] = useState(0);
  const PAGE_SIZE = 12;

  const papersQuery = trpc.tech.papers.list.useQuery({
    limit: PAGE_SIZE,
    offset: paperOffset,
    researchType: paperType === "all" ? undefined : paperType,
    keyword: keyword || undefined,
  });

  const patentsQuery = trpc.tech.patents.list.useQuery({
    limit: PAGE_SIZE,
    offset: patentOffset,
    country: patentCountry === "all" ? undefined : patentCountry,
    status: patentStatus === "all" ? undefined : patentStatus,
    keyword: keyword || undefined,
  });

  const handleSearch = () => {
    setKeyword(searchInput);
    setPaperOffset(0);
    setPatentOffset(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4]">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-stone-200 bg-stone-900 text-stone-100 py-14">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <FlaskConical className="w-6 h-6 text-amber-400" />
            <span className="text-amber-400 text-sm font-light tracking-[0.2em] uppercase">Technology Frontier</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 leading-tight">
            技术前沿
          </h1>
          <p className="text-stone-400 text-lg max-w-2xl font-light leading-relaxed">
            追踪全球钙钛矿光伏技术的最新研究突破与专利动态，汇聚顶级期刊论文与核心技术专利。
          </p>

          {/* Search */}
          <div className="mt-8 flex gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                className="pl-10 bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-amber-400"
                placeholder="搜索论文标题、机构、关键词..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-medium"
            >
              搜索
            </Button>
          </div>
        </div>
      </section>

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-10">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="flex items-center justify-between mb-8">
            <TabsList className="bg-stone-100 border border-stone-200 p-1">
              <TabsTrigger
                value="papers"
                className="data-[state=active]:bg-stone-900 data-[state=active]:text-stone-100 flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                研究论文
                {papersQuery.data && (
                  <span className="ml-1 text-xs opacity-70">({papersQuery.data.total})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="patents"
                className="data-[state=active]:bg-stone-900 data-[state=active]:text-stone-100 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                专利信息
                {patentsQuery.data && (
                  <span className="ml-1 text-xs opacity-70">({patentsQuery.data.total})</span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Papers Tab */}
          <TabsContent value="papers">
            {/* Filter bar */}
            <div className="flex flex-wrap gap-2 mb-8">
              {RESEARCH_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setPaperType(t.value); setPaperOffset(0); }}
                  className={`px-3 py-1.5 text-sm border rounded-full transition-all ${
                    paperType === t.value
                      ? "bg-stone-900 text-stone-100 border-stone-900"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {papersQuery.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 bg-stone-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : papersQuery.data?.items.length === 0 ? (
              <div className="text-center py-20 text-stone-400">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">暂无研究论文</p>
                <p className="text-sm mt-2">管理员可在后台初始化示例数据</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {papersQuery.data?.items.map((paper) => {
                    const authors = parseJsonArray(paper.authors);
                    const institutions = parseJsonArray(paper.institutions);
                    const keyFindings = parseJsonArray(paper.keyFindings);
                    const typeColor = RESEARCH_TYPE_COLORS[paper.researchType] ?? RESEARCH_TYPE_COLORS.other;
                    const typeLabel = RESEARCH_TYPES.find((t) => t.value === paper.researchType)?.label ?? paper.researchType;
                    return (
                      <Link key={paper.id} href={`/tech/paper/${paper.id}`}>
                        <div className="group bg-white border border-stone-200 rounded-lg p-6 hover:border-stone-400 hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeColor}`}>
                              {typeLabel}
                            </span>
                            {paper.isHighlight && (
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="font-serif text-base font-semibold text-stone-900 mb-2 leading-snug group-hover:text-stone-700 line-clamp-3 flex-1">
                            {paper.title}
                          </h3>

                          {/* Summary */}
                          {paper.summary && (
                            <p className="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-3">
                              {paper.summary}
                            </p>
                          )}

                          {/* Key findings */}
                          {keyFindings.length > 0 && (
                            <ul className="mb-3 space-y-1">
                              {keyFindings.slice(0, 2).map((f, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-stone-600">
                                  <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Meta */}
                          <div className="mt-auto pt-3 border-t border-stone-100 space-y-1.5">
                            {paper.journal && (
                              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                                <BookOpen className="w-3 h-3" />
                                <span className="font-medium italic">{paper.journal}</span>
                              </div>
                            )}
                            {institutions.length > 0 && (
                              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                                <Building2 className="w-3 h-3" />
                                <span className="truncate">{institutions.slice(0, 2).join("、")}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-stone-400">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(paper.publishedAt).toLocaleDateString("zh-CN")}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {papersQuery.data && papersQuery.data.total > PAGE_SIZE && (
                  <div className="flex justify-center gap-3 mt-10">
                    <Button
                      variant="outline"
                      disabled={paperOffset === 0}
                      onClick={() => setPaperOffset(Math.max(0, paperOffset - PAGE_SIZE))}
                    >
                      上一页
                    </Button>
                    <span className="flex items-center text-sm text-stone-500">
                      第 {Math.floor(paperOffset / PAGE_SIZE) + 1} / {Math.ceil(papersQuery.data.total / PAGE_SIZE)} 页
                    </span>
                    <Button
                      variant="outline"
                      disabled={paperOffset + PAGE_SIZE >= papersQuery.data.total}
                      onClick={() => setPaperOffset(paperOffset + PAGE_SIZE)}
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Patents Tab */}
          <TabsContent value="patents">
            {/* Filter bar */}
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="flex gap-2">
                <span className="text-sm text-stone-500 self-center">国家：</span>
                {["all", "CN", "US", "EP", "JP"].map((c) => (
                  <button
                    key={c}
                    onClick={() => { setPatentCountry(c); setPatentOffset(0); }}
                    className={`px-3 py-1.5 text-sm border rounded-full transition-all ${
                      patentCountry === c
                        ? "bg-stone-900 text-stone-100 border-stone-900"
                        : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    {c === "all" ? "全部" : c}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <span className="text-sm text-stone-500 self-center">状态：</span>
                {[
                  { value: "all", label: "全部" },
                  { value: "pending", label: "审中" },
                  { value: "granted", label: "已授权" },
                  { value: "expired", label: "失效" },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { setPatentStatus(s.value); setPatentOffset(0); }}
                    className={`px-3 py-1.5 text-sm border rounded-full transition-all ${
                      patentStatus === s.value
                        ? "bg-stone-900 text-stone-100 border-stone-900"
                        : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {patentsQuery.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-28 bg-stone-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : patentsQuery.data?.items.length === 0 ? (
              <div className="text-center py-20 text-stone-400">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">暂无专利信息</p>
                <p className="text-sm mt-2">管理员可在后台初始化示例数据</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {patentsQuery.data?.items.map((patent) => {
                    const applicants = parseJsonArray(patent.applicants);
                    const inventors = parseJsonArray(patent.inventors);
                    const tags = parseJsonArray(patent.tags);
                    const statusColor = PATENT_STATUS_COLORS[patent.status] ?? PATENT_STATUS_COLORS.pending;
                    return (
                      <Link key={patent.id} href={`/tech/patent/${patent.id}`}>
                        <div className="group bg-white border border-stone-200 rounded-lg p-6 hover:border-stone-400 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor}`}>
                                  {PATENT_STATUS_LABELS[patent.status]}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full border bg-stone-100 text-stone-600 border-stone-200">
                                  {PATENT_TYPE_LABELS[patent.patentType]}
                                </span>
                                <span className="text-xs text-stone-400 font-mono">{patent.country}</span>
                                {patent.isHighlight && (
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                )}
                              </div>
                              <h3 className="font-serif text-base font-semibold text-stone-900 mb-1.5 group-hover:text-stone-700 line-clamp-2">
                                {patent.title}
                              </h3>
                              {patent.summary && (
                                <p className="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-3">
                                  {patent.summary}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400">
                                {patent.patentNumber && (
                                  <span className="font-mono">{patent.patentNumber}</span>
                                )}
                                {applicants.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {applicants.slice(0, 2).join("、")}
                                  </span>
                                )}
                                {patent.filedAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    申请：{new Date(patent.filedAt).toLocaleDateString("zh-CN")}
                                  </span>
                                )}
                                {patent.ipcCode && (
                                  <span className="flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {patent.ipcCode}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 flex-shrink-0 mt-1 transition-colors" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {patentsQuery.data && patentsQuery.data.total > PAGE_SIZE && (
                  <div className="flex justify-center gap-3 mt-10">
                    <Button
                      variant="outline"
                      disabled={patentOffset === 0}
                      onClick={() => setPatentOffset(Math.max(0, patentOffset - PAGE_SIZE))}
                    >
                      上一页
                    </Button>
                    <span className="flex items-center text-sm text-stone-500">
                      第 {Math.floor(patentOffset / PAGE_SIZE) + 1} / {Math.ceil(patentsQuery.data.total / PAGE_SIZE)} 页
                    </span>
                    <Button
                      variant="outline"
                      disabled={patentOffset + PAGE_SIZE >= patentsQuery.data.total}
                      onClick={() => setPatentOffset(patentOffset + PAGE_SIZE)}
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <SiteFooter />
    </div>
  );
}
