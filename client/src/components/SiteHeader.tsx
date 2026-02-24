import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const navLinks = [
  { href: "/news", label: "行业资讯" },
  { href: "/tenders", label: "招投标" },
  { href: "/manufacturers", label: "厂家数据库" },
  { href: "/efficiency", label: "效率记录" },
  { href: "/tech", label: "技术前沿" },
];

export default function SiteHeader() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="bg-background border-b border-foreground/20 sticky top-0 z-50">
      {/* Top bar */}
      <div className="border-b border-foreground/10">
        <div className="container flex items-center justify-between py-1.5">
          <div className="flex items-center gap-4">
            <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-muted">
              全球钙钛矿光伏行业资讯平台
            </span>
            <span className="text-foreground/20">·</span>
            <span className="font-sans text-[10px] tracking-[0.15em] text-foreground/40 font-medium">
              鹑火FL内刊
            </span>
            <span className="text-foreground/20">|</span>
            <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted">
              {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && user?.role === "admin" && (
              <Link href="/admin" className="font-sans text-[10px] tracking-[0.15em] uppercase text-ink-muted hover:text-foreground transition-colors">
                管理后台
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container">
        <div className="py-5 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span
                  className="font-display text-2xl md:text-3xl font-black tracking-tight leading-none text-foreground"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  钙钛矿
                </span>
                <span
                  className="font-sans text-[10px] tracking-[0.2em] text-foreground/50 border border-foreground/30 px-1.5 py-0.5 whitespace-nowrap"
                >
                  鹑火FL内刊
                </span>
              </div>
              <span
                className="font-display text-2xl md:text-3xl font-black tracking-tight leading-none text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                光伏资讯
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-px bg-foreground flex-1" />
                <span className="font-sans text-[9px] tracking-[0.25em] uppercase text-ink-muted whitespace-nowrap">
                  Perovskite PV Intelligence
                </span>
                <div className="h-px bg-foreground flex-1" />
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 font-sans text-xs tracking-[0.15em] uppercase transition-colors border-b-2 ${
                  location === link.href || location.startsWith(link.href + "/")
                    ? "border-foreground text-foreground font-semibold"
                    : "border-transparent text-ink-muted hover:text-foreground hover:border-foreground/40"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search + mobile toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-ink-muted hover:text-foreground transition-colors"
              aria-label="搜索"
            >
              <Search size={16} />
            </button>
            <button
              className="md:hidden p-2 text-ink-muted hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="菜单"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="pb-4 border-t border-foreground/10 pt-3">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <Search size={14} className="text-ink-light flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索新闻、招投标、厂家..."
                className="flex-1 bg-transparent font-sans text-sm text-foreground placeholder:text-ink-light outline-none border-b border-foreground/20 pb-1 focus:border-foreground transition-colors"
              />
              <button type="submit" className="font-sans text-xs tracking-[0.15em] uppercase text-ink-muted hover:text-foreground transition-colors flex items-center gap-1">
                搜索 <ChevronRight size={12} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-foreground/10 bg-background">
          <div className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`py-2.5 font-sans text-xs tracking-[0.15em] uppercase border-b border-foreground/5 ${
                  location === link.href ? "text-foreground font-semibold" : "text-ink-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
