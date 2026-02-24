import { Link } from "wouter";

export default function SiteFooter() {
  return (
    <footer className="bg-foreground text-primary-foreground mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-baseline gap-2 mb-3">
              <h2 className="font-display text-2xl font-black text-primary-foreground">
                钙钛矿光伏资讯
              </h2>
              <span className="font-sans text-[10px] tracking-[0.15em] text-primary-foreground/40 border border-primary-foreground/20 px-1.5 py-0.5 whitespace-nowrap">
                鹑火FL内刊
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-primary-foreground/60 max-w-xs">
              全球钙钛矿光伏行业权威资讯平台，汇聚最新行业动态、招投标信息与企业数据，助力行业发展。
            </p>
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-primary-foreground/40 mt-4">
              Perovskite PV Intelligence
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-sans text-[10px] tracking-[0.2em] uppercase text-primary-foreground/40 mb-4">
              内容导航
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/news", label: "行业资讯" },
                { href: "/tenders", label: "招投标信息" },
                { href: "/manufacturers", label: "厂家数据库" },
                { href: "/efficiency", label: "效率记录" },
                { href: "/search", label: "全站搜索" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="font-sans text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-sans text-[10px] tracking-[0.2em] uppercase text-primary-foreground/40 mb-4">
              资讯分类
            </h3>
            <ul className="space-y-2">
              {[
                "国内动态",
                "国际资讯",
                "技术研究",
                "政策法规",
                "市场分析",
              ].map((cat) => (
                <li key={cat}>
                  <span className="font-sans text-xs text-primary-foreground/60">{cat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="border-t border-primary-foreground/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-sans text-[10px] text-primary-foreground/40 tracking-wide">
            © 2026 鹑火FL内刊 · 钙钛矿光伏资讯 · 数据每日自动更新
          </p>
          <p className="font-sans text-[10px] text-primary-foreground/30 tracking-wide">
            信息仅供参考，投资决策请结合专业意见
          </p>
        </div>
      </div>
    </footer>
  );
}
