"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart2,
  ShoppingBag,
  Megaphone,
  Settings,
  Store,
  Sun,
  Moon,
  TrendingUp,
  Receipt,
  PieChart,
  Wallet,
  UtensilsCrossed,
  FlaskConical,
  Calculator,
  Tag,
  Megaphone as Campaign,
  Monitor,
  Image,
  LineChart,
  Users,
  ShieldCheck,
  Database,
  ClipboardList,
  CalendarDays,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/utils/cn";

const navItems = [
  { href: "/",           icon: Home,        label: "ホーム",   permission: "view_dashboard" },
  { href: "/accounting", icon: BarChart2,   label: "会計",     permission: "view_accounting" },
  { href: "/products",   icon: ShoppingBag, label: "商品",     permission: "view_products" },
  { href: "/marketing",  icon: Megaphone,   label: "広報",     permission: "view_marketing" },
  { href: "/system",     icon: Settings,    label: "システム", permission: "manage_users" },
  { href: "/store",      icon: Store,       label: "店舗",     permission: "view_store" },
] as const;

const sectionSubNav: Record<
  string,
  { href: string; icon: React.ElementType; label: string; permission?: string }[]
> = {
  "/accounting": [
    { href: "/accounting",          icon: TrendingUp, label: "売上管理" },
    { href: "/accounting/expenses", icon: Receipt,    label: "支出管理" },
    { href: "/accounting/pl",       icon: PieChart,   label: "損益計算書" },
    { href: "/accounting/budget",   icon: Wallet,     label: "予算管理" },
  ],
  "/products": [
    { href: "/products",            icon: UtensilsCrossed, label: "商品一覧" },
    { href: "/products/recipes",    icon: FlaskConical,    label: "レシピ管理" },
    { href: "/products/cost",       icon: Calculator,      label: "原価計算" },
    { href: "/products/categories", icon: Tag,             label: "カテゴリ管理" },
  ],
  "/marketing": [
    { href: "/marketing",           icon: Campaign,  label: "キャンペーン" },
    { href: "/marketing/pr",        icon: Monitor,   label: "PR活動" },
    { href: "/marketing/analytics", icon: LineChart, label: "効果分析" },
    { href: "/marketing/media",     icon: Image,     label: "メディア素材" },
  ],
  "/system": [
    { href: "/system",        icon: Users,       label: "ユーザー管理", permission: "manage_users" },
    { href: "/system/roles",  icon: ShieldCheck, label: "ロール・権限", permission: "manage_users" },
    { href: "/system/master", icon: Database,    label: "マスタ設定",   permission: "manage_master" },
  ],
  "/store": [
    { href: "/store",            icon: ClipboardList, label: "日報" },
    { href: "/store/shift",      icon: CalendarDays,  label: "シフト管理" },
    { href: "/store/inventory",  icon: PackageSearch, label: "在庫チェック" },
    { href: "/store/orders",     icon: ShoppingCart,  label: "発注管理" },
  ],
};

function getActiveSection(pathname: string) {
  if (pathname === "/") return null;
  return Object.keys(sectionSubNav).find((key) => pathname.startsWith(key)) ?? null;
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-600 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      aria-label="テーマ切替"
    >
      {isDark ? (
        <Sun size={16} className="text-yellow-400" />
      ) : (
        <Moon size={16} className="text-neutral-600" />
      )}
      <span className="hidden xl:inline text-neutral-700 dark:text-neutral-300">
        {isDark ? "ライト" : "ダーク"}
      </span>
    </button>
  );
}

export default function DashboardLayoutClient({
  children,
  permissions,
}: {
  children: React.ReactNode;
  /** null = 権限テーブル未設定（全表示）、string[] = 許可された権限リスト */
  permissions: string[] | null;
}) {
  const { setTheme } = useTheme();
  const pathname = usePathname();
  const [isLg, setIsLg] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsLg(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      setIsLg(e.matches);
      if (!e.matches) setTheme("system");
    };
    mq.addEventListener("change", handler);
    if (!mq.matches) setTheme("system");
    return () => mq.removeEventListener("change", handler);
  }, [setTheme]);

  const permSet = permissions ? new Set(permissions) : null;
  const canAccess = (perm?: string) => !perm || !permSet || permSet.has(perm);

  const visibleNavItems = navItems.filter((item) => canAccess(item.permission));
  const activeSection = getActiveSection(pathname);
  const rawSubNav = activeSection ? sectionSubNav[activeSection] : null;
  const subNav = rawSubNav?.filter((item) => canAccess(item.permission)) ?? null;

  return (
    <>
      <div className="flex h-dvh overflow-hidden bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">

        {/* 左サイドナビ（PC: lg以上のみ） */}
        <nav className="hidden lg:flex flex-col items-center gap-1 w-14 shrink-0 border-r border-neutral-200 dark:border-neutral-800 py-4 bg-white dark:bg-neutral-950">
          {visibleNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <div key={href} className="relative group w-full flex justify-center">
                <Link
                  href={href}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
                  )}
                  aria-label={label}
                >
                  <Icon size={20} />
                </Link>
                <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 hidden group-hover:block">
                  <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                    {label}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* 左ペイン：セクション別サブナビ（PC: lg以上のみ） */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Merrimana
            </span>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            {subNav ? (
              <ul className="space-y-0.5">
                {subNav.map(({ href, icon: Icon, label }) => {
                  const isActive = href === activeSection ? pathname === href : pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
                        )}
                      >
                        <Icon size={15} />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-neutral-400 px-3 pt-2">セクションを選択</p>
            )}
          </nav>
        </aside>

        {/* メインエリア */}
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between h-12 px-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-950">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              メリリーカフェ 管理システム
            </span>
            {mounted && isLg && <ThemeToggle />}
          </header>

          {/* モバイル：セクションのサブナビ（横スクロール） */}
          {subNav && (
            <div className="lg:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 shrink-0 scrollbar-none">
              {subNav.map(({ href, icon: Icon, label }) => {
                const isActive = href === activeSection ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                    )}
                  >
                    <Icon size={13} />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="flex flex-1 min-h-0">
            <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
              {children}
            </main>

            <aside className="hidden xl:flex flex-col w-68 shrink-0 border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  クイックアクション
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <RightPanel section={activeSection} permissions={permSet} />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* 下ナビ（スマホ・iPad: lg未満のみ） */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur border-t border-neutral-200 dark:border-neutral-800 flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {visibleNavItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors min-w-0",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-neutral-400 dark:text-neutral-500"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={cn("text-[10px] truncate w-full text-center", isActive && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function RightPanel({ section, permissions }: { section: string | null; permissions: Set<string> | null }) {
  const canAccess = (perm: string) => !permissions || permissions.has(perm);

  if (!section) {
    return (
      <div className="space-y-2">
        {canAccess("view_accounting") && <QuickLink href="/accounting" label="売上を確認" />}
        {canAccess("view_store") && <QuickLink href="/store" label="日報を入力" />}
        {canAccess("view_products") && <QuickLink href="/products" label="商品を管理" />}
      </div>
    );
  }

  const allActions: Record<string, { label: string; href: string; permission?: string }[]> = {
    "/accounting": [
      { label: "売上を入力",   href: "/accounting" },
      { label: "支出を記録",   href: "/accounting/expenses" },
      { label: "損益を確認",   href: "/accounting/pl" },
    ],
    "/products": [
      { label: "新商品を登録", href: "/products" },
      { label: "レシピを追加", href: "/products/recipes" },
      { label: "原価を計算",   href: "/products/cost" },
    ],
    "/marketing": [
      { label: "キャンペーンを作成",  href: "/marketing" },
      { label: "PR活動を追加",        href: "/marketing/pr" },
      { label: "素材をアップロード",  href: "/marketing/media" },
    ],
    "/system": [
      { label: "ユーザーを招待",  href: "/system",        permission: "manage_users" },
      { label: "権限を変更",      href: "/system/roles",  permission: "manage_users" },
      { label: "マスタ設定",      href: "/system/master", permission: "manage_master" },
    ],
    "/store": [
      { label: "日報を提出",   href: "/store" },
      { label: "在庫を更新",   href: "/store/inventory" },
      { label: "発注を申請",   href: "/store/orders" },
    ],
  };

  const items = (allActions[section] ?? []).filter((item) => canAccess(item.permission ?? ""));
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <QuickLink key={item.href} href={item.href} label={item.label} />
      ))}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block w-full text-left px-3 py-2 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
    >
      {label}
    </Link>
  );
}
