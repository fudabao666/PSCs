import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, RefreshCw, Plus, Trash2, Edit, CheckCircle, AlertCircle, ExternalLink, Search, X, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Tab = "news" | "tenders" | "manufacturers" | "data" | "tech";

export default function AdminPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("data");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="container py-12 flex-1 flex items-center justify-center">
          <div className="animate-pulse font-sans text-ink-muted">加载中...</div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="container py-20 text-center flex-1">
          <p className="font-display text-3xl font-bold text-foreground/20 mb-4" style={{ fontFamily: "var(--font-display)" }}>
            请先登录
          </p>
          <a href={getLoginUrl()}
            className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.15em] uppercase bg-foreground text-primary-foreground px-6 py-3 hover:bg-ink-muted transition-colors">
            登录账户
          </a>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="container py-20 text-center flex-1">
          <AlertCircle size={40} className="mx-auto mb-4 text-destructive/40" />
          <p className="font-display text-3xl font-bold text-foreground/20 mb-2" style={{ fontFamily: "var(--font-display)" }}>
            无访问权限
          </p>
          <p className="font-sans text-sm text-ink-light mb-6">此页面仅限管理员访问</p>
          <Link href="/" className="font-sans text-xs text-ink-muted hover:text-foreground transition-colors inline-flex items-center gap-1">
            <ArrowLeft size={12} /> 返回首页
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "data", label: "数据更新" },
    { id: "news", label: "新闻管理" },
    { id: "tenders", label: "招投标管理" },
    { id: "manufacturers", label: "厂家管理" },
    { id: "tech", label: "技术前沿" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-foreground/10 bg-muted/30">
          <div className="container py-6">
            <div className="editorial-rule-thick mb-3" />
            <h1 className="font-display text-3xl font-black text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              管理后台
            </h1>
            <p className="font-sans text-xs text-ink-muted mt-1">欢迎，{user.name}</p>
          </div>
        </div>

        <div className="container py-6">
          {/* Tab nav */}
          <div className="flex gap-0 mb-8 border-b border-foreground/10">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`font-sans text-xs tracking-[0.12em] uppercase px-5 py-3 border-b-2 transition-colors ${activeTab === tab.id ? "border-foreground text-foreground font-semibold" : "border-transparent text-ink-muted hover:text-foreground"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "data" && <DataUpdateTab />}
          {activeTab === "news" && <NewsManageTab />}
          {activeTab === "tenders" && <TendersManageTab />}
          {activeTab === "manufacturers" && <ManufacturersManageTab />}
          {activeTab === "tech" && <TechManageTab />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function DataUpdateTab() {
  const utils = trpc.useUtils();
  const triggerFetch = trpc.dataFetch.triggerFetch.useMutation({
    onSuccess: (data) => {
      toast.success(`数据更新完成：新增 ${data.newsCount} 条新闻，${data.tenderCount} 条招投标信息`);
      utils.news.latest.invalidate();
      utils.tenders.latest.invalidate();
    },
    onError: (err: { message: string }) => toast.error(`更新失败：${err.message}`),
  });

  const seedManufacturers = trpc.manufacturers.seed.useMutation({
    onSuccess: (res) => {
      toast.success(`成功写入 ${res.count} 家全球主要钙钛矿企业数据`);
      utils.manufacturers.list.invalidate();
    },
    onError: (err) => toast.error(`厂家初始化失败：${err.message}`),
  });

  const seedEfficiency = trpc.efficiency.seed.useMutation({
    onSuccess: (res) => {
      toast.success(`成功写入 ${res.count} 条权威效率历史记录（NREL等来源）`);
      utils.efficiency.list.invalidate();
      utils.efficiency.chartData.invalidate();
      utils.efficiency.current.invalidate();
    },
    onError: (err) => toast.error(`效率数据初始化失败：${err.message}`),
  });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold mb-4">
          自动数据更新
        </h2>
        <div className="bg-muted p-6 space-y-4">
          <p className="font-sans text-sm text-foreground">
            点击下方按钮手动触发数据更新。系统将通过 AI 自动生成最新的行业新闻和招投标信息。
          </p>
          <p className="font-sans text-xs text-ink-muted">
            注意：自动更新任务每天 08:00 自动执行，无需手动触发。
          </p>
          <Button
            onClick={() => triggerFetch.mutate()}
            disabled={triggerFetch.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} className={triggerFetch.isPending ? "animate-spin" : ""} />
            {triggerFetch.isPending ? "更新中..." : "立即更新新闻与招投标数据"}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted font-semibold mb-4">
          初始化数据
        </h2>
        <div className="bg-muted p-6 space-y-4">
          <p className="font-sans text-sm text-foreground">
            首次使用时，点击下方按钮写入基础数据。
          </p>
          <ul className="font-sans text-xs text-ink-muted space-y-1 list-disc list-inside">
            <li>厂家数据：全球30家主要钙钛矿光伏企业（含官网、成立年份、技术成就），来源：perovskite-info.com、企业官网及行业报告</li>
            <li>效率数据：NREL权威认证历史记录（2009—2025年），来源：NREL Best Research-Cell Efficiency Chart、Fluxim、Solar Cell Efficiency Tables</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => seedManufacturers.mutate()} disabled={seedManufacturers.isPending}>
              {seedManufacturers.isPending ? "写入中..." : "写入全球30家厂家数据"}
            </Button>
            <Button variant="outline" onClick={() => seedEfficiency.mutate()} disabled={seedEfficiency.isPending}>
              {seedEfficiency.isPending ? "写入中..." : "写入NREL权威效率历史数据"}
            </Button>
          </div>
          <p className="font-sans text-xs text-ink-muted">
            技术前沿数据（论文、专利）可在「技术前沿」标签页中手动添加和管理。
          </p>
        </div>
      </div>
    </div>
  );
}

function NewsManageTab() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.news.list.useQuery({ page: 1, pageSize: 20 });
  const deleteNews = trpc.news.delete.useMutation({
    onSuccess: () => { toast.success("删除成功"); utils.news.list.invalidate(); },
    onError: (err) => toast.error(`删除失败：${err.message}`),
  });
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="font-sans text-sm text-ink-muted">共 {data?.total ?? 0} 条新闻</p>
        <Button size="sm" onClick={() => setShowAdd(true)} className="flex items-center gap-1.5">
          <Plus size={13} /> 添加新闻
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <div className="space-y-0">
          {data?.items.map((item, idx) => (
            <div key={item.id} className={`flex items-center gap-4 py-3.5 ${idx < (data?.items.length ?? 0) - 1 ? "border-b border-foreground/10" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-foreground line-clamp-1">{item.title}</p>
                <p className="font-sans text-[10px] text-ink-light mt-0.5">
                  {item.sourceName} · {format(new Date(item.publishedAt), "yyyy-MM-dd")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toast.info("编辑功能即将推出")}
                  className="p-1.5 text-ink-light hover:text-foreground transition-colors">
                  <Edit size={13} />
                </button>
                <button onClick={() => { if (confirm("确认删除？")) deleteNews.mutate({ id: item.id }); }}
                  className="p-1.5 text-ink-light hover:text-destructive transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddNewsDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}

function AddNewsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  type NewsCategory = "domestic" | "international" | "research" | "policy" | "market" | "technology";
  const [form, setForm] = useState<{ title: string; summary: string; sourceName: string; category: NewsCategory; isImportant: boolean }>({ title: "", summary: "", sourceName: "", category: "domestic", isImportant: false });
  const createNews = trpc.news.create.useMutation({
    onSuccess: () => { toast.success("添加成功"); utils.news.list.invalidate(); onClose(); setForm({ title: "", summary: "", sourceName: "", category: "domestic", isImportant: false }); },
    onError: (err: { message: string }) => toast.error(`添加失败：${err.message}`),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display" style={{ fontFamily: "var(--font-display)" }}>添加新闻</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted block mb-1.5">标题 *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="新闻标题" />
          </div>
          <div>
            <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted block mb-1.5">摘要</label>
            <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="新闻摘要" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted block mb-1.5">来源</label>
              <Input value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} placeholder="来源名称" />
            </div>
            <div>
              <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted block mb-1.5">分类</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as NewsCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {([["domestic","国内"],["international","国际"],["research","研究"],["policy","政策"],["market","市场"],["technology","技术"]] as [NewsCategory, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={() => createNews.mutate(form)} disabled={!form.title || createNews.isPending}>
            {createNews.isPending ? "添加中..." : "添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TendersManageTab() {
  const utils = trpc.useUtils();

  // ── Filter state ──────────────────────────────────────────────
  const [keyword, setKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const queryParams = {
    page,
    pageSize: PAGE_SIZE,
    keyword: keyword || undefined,
    status: filterStatus || undefined,
    projectType: filterType || undefined,
    region: filterRegion || undefined,
  };
  const { data, isLoading } = trpc.tenders.list.useQuery(queryParams);

  // ── Edit dialog state ─────────────────────────────────────────
  const [editItem, setEditItem] = useState<null | {
    id: number; title: string; sourceUrl: string; sourcePlatform: string;
    publisherName: string; region: string; budget: string;
    status: "open"|"closed"|"awarded"|"cancelled";
    projectType: "procurement"|"construction"|"research"|"service"|"other";
    isImportant: boolean;
  }>(null);

  // ── Add dialog state ──────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "", description: "", sourceUrl: "", sourcePlatform: "",
    publisherName: "", region: "", budget: "",
    projectType: "procurement" as "procurement"|"construction"|"research"|"service"|"other",
    status: "open" as "open"|"closed"|"awarded"|"cancelled",
    isImportant: false,
  });

  // ── Mutations ─────────────────────────────────────────────────
  const deleteTender = trpc.tenders.delete.useMutation({
    onSuccess: () => { toast.success("删除成功"); utils.tenders.list.invalidate(); },
    onError: (err) => toast.error(`删除失败：${err.message}`),
  });
  const updateTender = trpc.tenders.update.useMutation({
    onSuccess: () => { toast.success("更新成功"); setEditItem(null); utils.tenders.list.invalidate(); },
    onError: (err) => toast.error(`更新失败：${err.message}`),
  });
  const createTender = trpc.tenders.create.useMutation({
    onSuccess: () => { toast.success("添加成功"); setShowAdd(false); utils.tenders.list.invalidate(); setAddForm({ title: "", description: "", sourceUrl: "", sourcePlatform: "", publisherName: "", region: "", budget: "", projectType: "procurement", status: "open", isImportant: false }); },
    onError: (err) => toast.error(`添加失败：${err.message}`),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  const statusLabel: Record<string, string> = { open: "招标中", closed: "已截止", awarded: "已中标", cancelled: "已取消" };
  const statusColor: Record<string, string> = { open: "text-emerald-700 bg-emerald-50", closed: "text-gray-500 bg-gray-100", awarded: "text-blue-700 bg-blue-50", cancelled: "text-red-600 bg-red-50" };
  const typeLabel: Record<string, string> = { procurement: "采购", construction: "建设", research: "研究", service: "服务", other: "其他" };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-base font-semibold text-foreground">招投标信息管理</h3>
          <p className="font-sans text-xs text-ink-muted mt-0.5">共 <span className="font-semibold text-foreground">{data?.total ?? 0}</span> 条，含来源网站链接</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="flex items-center gap-1.5">
          <Plus size={13} /> 添加招投标
        </Button>
      </div>

      {/* ── Filter bar ── */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="relative col-span-2 md:col-span-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-8 h-8 text-xs"
            placeholder="搜索标题/发布方/地区…"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          />
          {keyword && <button onClick={() => { setKeyword(""); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-foreground"><X size={11} /></button>}
        </div>
        <Select value={filterStatus || "all"} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="open">招标中</SelectItem>
            <SelectItem value="closed">已截止</SelectItem>
            <SelectItem value="awarded">已中标</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType || "all"} onValueChange={(v) => { setFilterType(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="procurement">采购</SelectItem>
            <SelectItem value="construction">建设</SelectItem>
            <SelectItem value="research">研究</SelectItem>
            <SelectItem value="service">服务</SelectItem>
            <SelectItem value="other">其他</SelectItem>
          </SelectContent>
        </Select>
        <Input className="h-8 text-xs" placeholder="地区筛选…" value={filterRegion} onChange={(e) => { setFilterRegion(e.target.value); setPage(1); }} />
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded" />)}</div>
      ) : data?.items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-sans text-sm text-ink-muted">暂无符合条件的招投标信息</p>
          <p className="font-sans text-xs text-ink-light mt-1">尝试调整筛选条件，或在「数据更新」中触发自动抓取</p>
        </div>
      ) : (
        <div className="border border-foreground/10 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_80px_120px_100px_80px] gap-3 px-4 py-2.5 bg-muted/60 border-b border-foreground/10">
            <span className="font-sans text-[10px] tracking-[0.12em] uppercase text-ink-muted font-semibold">标题 / 发布方</span>
            <span className="font-sans text-[10px] tracking-[0.12em] uppercase text-ink-muted font-semibold">类型</span>
            <span className="font-sans text-[10px] tracking-[0.12em] uppercase text-ink-muted font-semibold">状态</span>
            <span className="font-sans text-[10px] tracking-[0.12em] uppercase text-ink-muted font-semibold">来源平台</span>
            <span className="font-sans text-[10px] tracking-[0.12em] uppercase text-ink-muted font-semibold">截止日期</span>
            <span className="font-sans text-[10px] tracking-[0.12em] uppercase text-ink-muted font-semibold text-right">操作</span>
          </div>
          {/* Table rows */}
          {data?.items.map((item, idx) => (
            <div key={item.id} className={`grid grid-cols-[1fr_80px_80px_120px_100px_80px] gap-3 px-4 py-3.5 items-center hover:bg-muted/30 transition-colors ${idx < data.items.length - 1 ? "border-b border-foreground/8" : ""}`}>
              {/* Title + publisher */}
              <div className="min-w-0">
                <div className="flex items-start gap-1.5">
                  {item.isImportant && <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" title="重要" />}
                  <p className="font-sans text-sm text-foreground line-clamp-1 leading-snug">{item.title}</p>
                </div>
                <p className="font-sans text-[10px] text-ink-light mt-0.5 truncate">
                  {item.publisherName || "—"}{item.region ? ` · ${item.region}` : ""}
                  {item.budget ? ` · ${item.budget}` : ""}
                </p>
              </div>
              {/* Type */}
              <span className="font-sans text-xs text-ink-muted">{typeLabel[item.projectType] ?? item.projectType}</span>
              {/* Status badge */}
              <span className={`font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${statusColor[item.status] ?? ""}`}>
                {statusLabel[item.status] ?? item.status}
              </span>
              {/* Source platform + link */}
              <div className="flex items-center gap-1.5 min-w-0">
                {item.sourceUrl ? (
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 font-sans text-xs text-blue-700 hover:text-blue-900 transition-colors truncate max-w-[100px]"
                    title={item.sourceUrl}>
                    <ExternalLink size={10} className="flex-shrink-0" />
                    <span className="truncate">{item.sourcePlatform || new URL(item.sourceUrl).hostname.replace("www.","")}</span>
                  </a>
                ) : (
                  <span className="font-sans text-xs text-ink-light">{item.sourcePlatform || "—"}</span>
                )}
              </div>
              {/* Deadline */}
              <span className="font-sans text-xs text-ink-muted">
                {item.deadline ? format(new Date(item.deadline), "MM-dd") : "—"}
              </span>
              {/* Actions */}
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={() => setEditItem({
                    id: item.id,
                    title: item.title,
                    sourceUrl: item.sourceUrl ?? "",
                    sourcePlatform: item.sourcePlatform ?? "",
                    publisherName: item.publisherName ?? "",
                    region: item.region ?? "",
                    budget: item.budget ?? "",
                    status: item.status as "open"|"closed"|"awarded"|"cancelled",
                    projectType: item.projectType as "procurement"|"construction"|"research"|"service"|"other",
                    isImportant: item.isImportant,
                  })}
                  className="p-1.5 text-ink-light hover:text-foreground transition-colors" title="编辑">
                  <Edit size={12} />
                </button>
                <button
                  onClick={() => { if (confirm(`确认删除「${item.title}」？`)) deleteTender.mutate({ id: item.id }); }}
                  className="p-1.5 text-ink-light hover:text-destructive transition-colors" title="删除">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="font-sans text-xs text-ink-muted">第 {page} / {totalPages} 页</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</Button>
          </div>
        </div>
      )}

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-base">编辑招投标信息</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-3 py-2">
              <div>
                <label className="font-sans text-xs text-ink-muted mb-1 block">标题</label>
                <Input value={editItem.title} onChange={(e) => setEditItem({ ...editItem, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-xs text-ink-muted mb-1 block">发布方</label>
                  <Input value={editItem.publisherName} onChange={(e) => setEditItem({ ...editItem, publisherName: e.target.value })} />
                </div>
                <div>
                  <label className="font-sans text-xs text-ink-muted mb-1 block">地区</label>
                  <Input value={editItem.region} onChange={(e) => setEditItem({ ...editItem, region: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="font-sans text-xs text-ink-muted mb-1 block">预算金额</label>
                <Input value={editItem.budget} onChange={(e) => setEditItem({ ...editItem, budget: e.target.value })} placeholder="如：500万元" />
              </div>
              <div>
                <label className="font-sans text-xs mb-1 flex items-center gap-1 font-semibold text-foreground">
                  来源网站链接 <span className="text-blue-600">(sourceUrl)</span>
                  <span className="text-red-500 font-bold">*</span>
                  <span className="text-red-500 text-[10px] font-normal ml-1">必填</span>
                </label>
                <Input
                  value={editItem.sourceUrl}
                  onChange={(e) => setEditItem({ ...editItem, sourceUrl: e.target.value })}
                  placeholder="https://（必填，填写招标信息原始来源网址）"
                  className={`font-mono text-xs ${!editItem.sourceUrl ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {!editItem.sourceUrl && (
                  <p className="mt-1 font-sans text-[10px] text-red-500">请填写信息来源网址，便于溯源核实</p>
                )}
                {editItem.sourceUrl && (
                  <a href={editItem.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 font-sans text-xs text-blue-600 hover:underline">
                    <ExternalLink size={10} /> 验证链接是否有效
                  </a>
                )}
              </div>
              <div>
                <label className="font-sans text-xs text-ink-muted mb-1 block">来源平台名称</label>
                <Input
                  value={editItem.sourcePlatform}
                  onChange={(e) => setEditItem({ ...editItem, sourcePlatform: e.target.value })}
                  placeholder="如：中国招标网、全国公共资源交易平台"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-xs text-ink-muted mb-1 block">项目类型</label>
                  <Select value={editItem.projectType} onValueChange={(v) => setEditItem({ ...editItem, projectType: v as typeof editItem.projectType })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["procurement","construction","research","service","other"] as const).map(v => (
                        <SelectItem key={v} value={v}>{typeLabel[v]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-sans text-xs text-ink-muted mb-1 block">状态</label>
                  <Select value={editItem.status} onValueChange={(v) => setEditItem({ ...editItem, status: v as typeof editItem.status })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["open","closed","awarded","cancelled"] as const).map(v => (
                        <SelectItem key={v} value={v}>{statusLabel[v]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isImportant" checked={editItem.isImportant} onChange={(e) => setEditItem({ ...editItem, isImportant: e.target.checked })} className="w-3.5 h-3.5" />
                <label htmlFor="isImportant" className="font-sans text-xs text-ink-muted cursor-pointer">标记为重要信息（将触发管理员通知）</label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditItem(null)}>取消</Button>
            <Button size="sm" disabled={updateTender.isPending || !editItem?.sourceUrl} onClick={() => editItem && updateTender.mutate({
              id: editItem.id,
              title: editItem.title,
              sourceUrl: editItem.sourceUrl || undefined,
              sourcePlatform: editItem.sourcePlatform || undefined,
              publisherName: editItem.publisherName || undefined,
              region: editItem.region || undefined,
              budget: editItem.budget || undefined,
              status: editItem.status,
              projectType: editItem.projectType,
              isImportant: editItem.isImportant,
            })} className="flex items-center gap-1.5">
              <Save size={12} /> {updateTender.isPending ? "保存中..." : (!editItem?.sourceUrl ? "请填写来源网址" : "保存更改")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Dialog ── */}
      <Dialog open={showAdd} onOpenChange={(o) => { if (!o) setShowAdd(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-base">添加招投标信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="font-sans text-xs text-ink-muted mb-1 block">标题 *</label>
              <Input value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} placeholder="招投标项目名称" />
            </div>
            <div>
              <label className="font-sans text-xs text-ink-muted mb-1 block">项目描述</label>
              <Textarea value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} rows={2} placeholder="简要描述项目内容" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-sans text-xs text-ink-muted mb-1 block">发布方</label>
                <Input value={addForm.publisherName} onChange={(e) => setAddForm({ ...addForm, publisherName: e.target.value })} />
              </div>
              <div>
                <label className="font-sans text-xs text-ink-muted mb-1 block">地区</label>
                <Input value={addForm.region} onChange={(e) => setAddForm({ ...addForm, region: e.target.value })} placeholder="如：广东省" />
              </div>
            </div>
            <div>
              <label className="font-sans text-xs mb-1 flex items-center gap-1 font-semibold text-foreground">
                来源网站链接 <span className="text-blue-600">(sourceUrl)</span>
                <span className="text-red-500 font-bold">*</span>
                <span className="text-red-500 text-[10px] font-normal ml-1">必填</span>
              </label>
              <Input
                value={addForm.sourceUrl}
                onChange={(e) => setAddForm({ ...addForm, sourceUrl: e.target.value })}
                placeholder="https://（必填，填写招标信息原始来源网址）"
                className={`font-mono text-xs ${!addForm.sourceUrl ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              {!addForm.sourceUrl && (
                <p className="mt-1 font-sans text-[10px] text-red-500">请填写信息来源网址，便于溯源核实</p>
              )}
              {addForm.sourceUrl && (
                <a href={addForm.sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 font-sans text-xs text-blue-600 hover:underline">
                  <ExternalLink size={10} /> 验证链接是否有效
                </a>
              )}
            </div>
            <div>
              <label className="font-sans text-xs text-ink-muted mb-1 block">来源平台名称</label>
              <Input value={addForm.sourcePlatform} onChange={(e) => setAddForm({ ...addForm, sourcePlatform: e.target.value })} placeholder="如：中国招标网" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-sans text-xs text-ink-muted mb-1 block">预算</label>
                <Input value={addForm.budget} onChange={(e) => setAddForm({ ...addForm, budget: e.target.value })} placeholder="如：500万元" />
              </div>
              <div>
                <label className="font-sans text-xs text-ink-muted mb-1 block">项目类型</label>
                <Select value={addForm.projectType} onValueChange={(v) => setAddForm({ ...addForm, projectType: v as typeof addForm.projectType })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["procurement","construction","research","service","other"] as const).map(v => (
                      <SelectItem key={v} value={v}>{typeLabel[v]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="addImportant" checked={addForm.isImportant} onChange={(e) => setAddForm({ ...addForm, isImportant: e.target.checked })} className="w-3.5 h-3.5" />
              <label htmlFor="addImportant" className="font-sans text-xs text-ink-muted cursor-pointer">标记为重要信息</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>取消</Button>
            <Button size="sm" disabled={createTender.isPending || !addForm.title || !addForm.sourceUrl} onClick={() => createTender.mutate(addForm)} className="flex items-center gap-1.5">
              <Plus size={12} /> {createTender.isPending ? "添加中..." : (!addForm.sourceUrl ? "请填写来源网址" : "确认添加")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ManufacturersManageTab() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.manufacturers.list.useQuery({ page: 1, pageSize: 20 });
  const deleteManufacturer = trpc.manufacturers.delete.useMutation({
    onSuccess: () => { toast.success("删除成功"); utils.manufacturers.list.invalidate(); },
    onError: (err) => toast.error(`删除失败：${err.message}`),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="font-sans text-sm text-ink-muted">共 {data?.total ?? 0} 家企业</p>
        <Button size="sm" onClick={() => toast.info("添加企业功能即将推出")} className="flex items-center gap-1.5">
          <Plus size={13} /> 添加企业
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <div className="space-y-0">
          {data?.items.map((item, idx) => (
            <div key={item.id} className={`flex items-center gap-4 py-3.5 ${idx < (data?.items.length ?? 0) - 1 ? "border-b border-foreground/10" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-foreground">{item.name}</p>
                <p className="font-sans text-[10px] text-ink-light mt-0.5">{item.country} · {item.stage}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toast.info("编辑功能即将推出")} className="p-1.5 text-ink-light hover:text-foreground transition-colors"><Edit size={13} /></button>
                <button onClick={() => { if (confirm("确认删除？")) deleteManufacturer.mutate({ id: item.id }); }} className="p-1.5 text-ink-light hover:text-destructive transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TechManageTab() {
  const utils = trpc.useUtils();
  const [activeSection, setActiveSection] = useState<"papers" | "patents">("papers");

  // Papers
  const { data: papersData, isLoading: papersLoading } = trpc.tech.papers.list.useQuery({ limit: 20, offset: 0 });
  const deletePaper = trpc.tech.papers.delete.useMutation({
    onSuccess: () => { toast.success("论文删除成功"); utils.tech.papers.list.invalidate(); },
    onError: (err) => toast.error(`删除失败：${err.message}`),
  });
  const addPaper = trpc.tech.papers.create.useMutation({
    onSuccess: () => { toast.success("论文添加成功"); utils.tech.papers.list.invalidate(); setShowPaperForm(false); },
    onError: (err) => toast.error(`添加失败：${err.message}`),
  });

  // Patents
  const { data: patentsData, isLoading: patentsLoading } = trpc.tech.patents.list.useQuery({ limit: 20, offset: 0 });
  const deletePatent = trpc.tech.patents.delete.useMutation({
    onSuccess: () => { toast.success("专利删除成功"); utils.tech.patents.list.invalidate(); },
    onError: (err) => toast.error(`删除失败：${err.message}`),
  });
  const addPatent = trpc.tech.patents.create.useMutation({
    onSuccess: () => { toast.success("专利添加成功"); utils.tech.patents.list.invalidate(); setShowPatentForm(false); },
    onError: (err) => toast.error(`添加失败：${err.message}`),
  });

  // Seed
  const seedTech = trpc.tech.seed.useMutation({
    onSuccess: (res: { success: boolean; papersCount: number; patentsCount: number }) => {
      toast.success(`成功写入 ${res.papersCount} 篇示例论文和 ${res.patentsCount} 条示例专利`);
      utils.tech.papers.list.invalidate();
      utils.tech.patents.list.invalidate();
    },
    onError: (err: { message: string }) => toast.error(`初始化失败：${err.message}`),
  });

  // Form state
  const [showPaperForm, setShowPaperForm] = useState(false);
  const [paperForm, setPaperForm] = useState<{ title: string; journal: string; doi: string; researchType: "efficiency"|"stability"|"materials"|"fabrication"|"tandem"|"flexible"|"commercialization"|"other"; publishedAt: string; summary: string; sourceUrl: string }>({ title: "", journal: "", doi: "", researchType: "efficiency", publishedAt: new Date().toISOString().split("T")[0], summary: "", sourceUrl: "" });
  const [showPatentForm, setShowPatentForm] = useState(false);
  const [patentForm, setPatentForm] = useState<{ title: string; patentNumber: string; country: string; patentType: "invention"|"utility"|"design"|"pct"; status: "pending"|"granted"|"rejected"|"expired"; filedAt: string; summary: string; sourceUrl: string }>({ title: "", patentNumber: "", country: "CN", patentType: "invention", status: "pending", filedAt: new Date().toISOString().split("T")[0], summary: "", sourceUrl: "" });

  return (
    <div>
      {/* Section toggle */}
      <div className="flex gap-0 mb-6 border-b border-foreground/10">
        {[{ id: "papers" as const, label: "研究论文" }, { id: "patents" as const, label: "专利信息" }].map((s) => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`font-sans text-xs tracking-[0.12em] uppercase px-4 py-2.5 border-b-2 transition-colors ${activeSection === s.id ? "border-foreground text-foreground font-semibold" : "border-transparent text-ink-muted hover:text-foreground"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Seed button */}
      <div className="mb-6 p-4 bg-muted rounded-lg flex items-center justify-between gap-4">
        <p className="font-sans text-xs text-ink-muted">首次使用可写入示例数据，包含代表性研究论文和专利信息。</p>
        <Button variant="outline" size="sm" onClick={() => seedTech.mutate()} disabled={seedTech.isPending}>
          {seedTech.isPending ? "写入中..." : "写入示例技术数据"}
        </Button>
      </div>

      {/* Papers section */}
      {activeSection === "papers" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans text-sm text-ink-muted">共 {papersData?.total ?? 0} 篇论文</p>
            <Button size="sm" onClick={() => setShowPaperForm(true)} className="flex items-center gap-1.5">
              <Plus size={13} /> 添加论文
            </Button>
          </div>

          {/* Add paper form */}
          {showPaperForm && (
            <div className="mb-6 p-5 border border-foreground/20 bg-muted/50 space-y-3">
              <h3 className="font-sans text-xs tracking-[0.15em] uppercase text-ink-muted font-semibold">添加研究论文</h3>
              <Input placeholder="论文标题 *" value={paperForm.title} onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="期刊名称" value={paperForm.journal} onChange={(e) => setPaperForm({ ...paperForm, journal: e.target.value })} />
                <Input placeholder="DOI" value={paperForm.doi} onChange={(e) => setPaperForm({ ...paperForm, doi: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select value={paperForm.researchType} onValueChange={(v) => setPaperForm({ ...paperForm, researchType: v as typeof paperForm.researchType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[["efficiency","效率突破"],["stability","稳定性"],["materials","材料创新"],["fabrication","制备工艺"],["tandem","叠层电池"],["flexible","柔性器件"],["commercialization","商业化"],["other","其他"]].map(([v,l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={paperForm.publishedAt} onChange={(e) => setPaperForm({ ...paperForm, publishedAt: e.target.value })} />
              </div>
              <Textarea placeholder="摘要/AI摘要" value={paperForm.summary} onChange={(e) => setPaperForm({ ...paperForm, summary: e.target.value })} rows={3} />
              <Input placeholder="原文链接" value={paperForm.sourceUrl} onChange={(e) => setPaperForm({ ...paperForm, sourceUrl: e.target.value })} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => addPaper.mutate({ ...paperForm, publishedAt: new Date(paperForm.publishedAt) })} disabled={addPaper.isPending || !paperForm.title}>
                  {addPaper.isPending ? "提交中..." : "确认添加"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowPaperForm(false)}>取消</Button>
              </div>
            </div>
          )}

          {papersLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
          ) : (
            <div className="space-y-0">
              {papersData?.items.map((item, idx) => (
                <div key={item.id} className={`flex items-center gap-4 py-3.5 ${idx < (papersData?.items.length ?? 0) - 1 ? "border-b border-foreground/10" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-foreground truncate">{item.title}</p>
                    <p className="font-sans text-[10px] text-ink-light mt-0.5">{item.journal ?? "—"} · {item.researchType} · {new Date(item.publishedAt).toLocaleDateString("zh-CN")}</p>
                  </div>
                  <button onClick={() => { if (confirm("确认删除此论文？")) deletePaper.mutate({ id: item.id }); }} className="p-1.5 text-ink-light hover:text-destructive transition-colors flex-shrink-0"><Trash2 size={13} /></button>
                </div>
              ))}
              {papersData?.items.length === 0 && <p className="text-center py-10 text-ink-light text-sm">暂无论文数据</p>}
            </div>
          )}
        </div>
      )}

      {/* Patents section */}
      {activeSection === "patents" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans text-sm text-ink-muted">共 {patentsData?.total ?? 0} 条专利</p>
            <Button size="sm" onClick={() => setShowPatentForm(true)} className="flex items-center gap-1.5">
              <Plus size={13} /> 添加专利
            </Button>
          </div>

          {/* Add patent form */}
          {showPatentForm && (
            <div className="mb-6 p-5 border border-foreground/20 bg-muted/50 space-y-3">
              <h3 className="font-sans text-xs tracking-[0.15em] uppercase text-ink-muted font-semibold">添加专利信息</h3>
              <Input placeholder="专利名称 *" value={patentForm.title} onChange={(e) => setPatentForm({ ...patentForm, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="专利号" value={patentForm.patentNumber} onChange={(e) => setPatentForm({ ...patentForm, patentNumber: e.target.value })} />
                <Select value={patentForm.country} onValueChange={(v) => setPatentForm({ ...patentForm, country: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[["CN","中国"],["US","美国"],["EP","欧洲"],["JP","日本"],["KR","韩国"],["PCT","PCT国际"]].map(([v,l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select value={patentForm.patentType} onValueChange={(v) => setPatentForm({ ...patentForm, patentType: v as typeof patentForm.patentType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[["invention","发明专利"],["utility","实用新型"],["design","外观设计"],["pct","PCT国际"]].map(([v,l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={patentForm.status} onValueChange={(v) => setPatentForm({ ...patentForm, status: v as typeof patentForm.status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[["pending","审查中"],["granted","已授权"],["rejected","已驳回"],["expired","已失效"]].map(([v,l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input type="date" placeholder="申请日期" value={patentForm.filedAt} onChange={(e) => setPatentForm({ ...patentForm, filedAt: e.target.value })} />
              <Textarea placeholder="专利摘要" value={patentForm.summary} onChange={(e) => setPatentForm({ ...patentForm, summary: e.target.value })} rows={3} />
              <Input placeholder="专利原文链接" value={patentForm.sourceUrl} onChange={(e) => setPatentForm({ ...patentForm, sourceUrl: e.target.value })} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => addPatent.mutate({ ...patentForm, filedAt: new Date(patentForm.filedAt) })} disabled={addPatent.isPending || !patentForm.title}>
                  {addPatent.isPending ? "提交中..." : "确认添加"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowPatentForm(false)}>取消</Button>
              </div>
            </div>
          )}

          {patentsLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
          ) : (
            <div className="space-y-0">
              {patentsData?.items.map((item, idx) => (
                <div key={item.id} className={`flex items-center gap-4 py-3.5 ${idx < (patentsData?.items.length ?? 0) - 1 ? "border-b border-foreground/10" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-foreground truncate">{item.title}</p>
                    <p className="font-sans text-[10px] text-ink-light mt-0.5">{item.patentNumber ?? "—"} · {item.country} · {item.status}</p>
                  </div>
                  <button onClick={() => { if (confirm("确认删除此专利？")) deletePatent.mutate({ id: item.id }); }} className="p-1.5 text-ink-light hover:text-destructive transition-colors flex-shrink-0"><Trash2 size={13} /></button>
                </div>
              ))}
              {patentsData?.items.length === 0 && <p className="text-center py-10 text-ink-light text-sm">暂无专利数据</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
