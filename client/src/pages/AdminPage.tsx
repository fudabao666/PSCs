import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, RefreshCw, Plus, Trash2, Edit, CheckCircle, AlertCircle } from "lucide-react";
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

type Tab = "news" | "tenders" | "manufacturers" | "data";

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
  const { data, isLoading } = trpc.tenders.list.useQuery({ page: 1, pageSize: 20 });
  const deleteTender = trpc.tenders.delete.useMutation({
    onSuccess: () => { toast.success("删除成功"); utils.tenders.list.invalidate(); },
    onError: (err) => toast.error(`删除失败：${err.message}`),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="font-sans text-sm text-ink-muted">共 {data?.total ?? 0} 条招投标信息</p>
        <Button size="sm" onClick={() => toast.info("添加招投标功能即将推出")} className="flex items-center gap-1.5">
          <Plus size={13} /> 添加招投标
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
                  {item.publisherName} · {item.region} · {format(new Date(item.publishedAt), "yyyy-MM-dd")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toast.info("编辑功能即将推出")} className="p-1.5 text-ink-light hover:text-foreground transition-colors"><Edit size={13} /></button>
                <button onClick={() => { if (confirm("确认删除？")) deleteTender.mutate({ id: item.id }); }} className="p-1.5 text-ink-light hover:text-destructive transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
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
