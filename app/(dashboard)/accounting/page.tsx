import { TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";

const MONTHLY_SALES = [
  { month: "10月", amount: 2100000 },
  { month: "11月", amount: 2450000 },
  { month: "12月", amount: 3200000 },
  { month: "1月", amount: 2800000 },
  { month: "2月", amount: 2600000 },
  { month: "3月", amount: 2841000 },
];

const EXPENSE_CATEGORIES = [
  { label: "原材料費", amount: 854000, color: "bg-blue-500", pct: 35 },
  { label: "人件費", amount: 730000, color: "bg-neutral-700 dark:bg-neutral-400", pct: 30 },
  { label: "家賃・光熱費", amount: 487000, color: "bg-blue-300", pct: 20 },
  { label: "その他", amount: 365000, color: "bg-neutral-400", pct: 15 },
];

const SUMMARY_CARDS = [
  { label: "今月売上", value: "¥2,841,000", sub: "前月比 +9.3%", up: true, icon: DollarSign },
  { label: "今月支出", value: "¥2,436,000", sub: "前月比 +2.1%", up: false, icon: TrendingDown },
  { label: "営業利益", value: "¥405,000", sub: "利益率 14.3%", up: true, icon: TrendingUp },
  { label: "月間来客数", value: "2,213名", sub: "前月比 +5.8%", up: true, icon: Users },
];

const maxAmount = Math.max(...MONTHLY_SALES.map((d) => d.amount));

export default function AccountingPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">売上管理</h1>
        <p className="text-sm text-neutral-500 mt-0.5">会計・経営戦略ユニット</p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SUMMARY_CARDS.map(({ label, value, sub, up, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-neutral-400">{label}</p>
              <Icon size={14} className="text-neutral-400" />
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
            <p className={`text-xs mt-1 font-medium ${up ? "text-blue-500" : "text-red-400"}`}>
              {up ? "▲" : "▼"} {sub}
            </p>
          </div>
        ))}
      </div>

      {/* 月次売上グラフ */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
          月次売上推移（直近6ヶ月）
        </h2>
        <div className="flex items-end gap-3 h-40">
          {MONTHLY_SALES.map(({ month, amount }) => {
            const heightPct = (amount / maxAmount) * 100;
            return (
              <div key={month} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xs text-neutral-500 tabular-nums">
                  {(amount / 10000).toFixed(0)}万
                </span>
                <div className="w-full flex items-end" style={{ height: "100px" }}>
                  <div
                    className="w-full rounded-t bg-blue-500 dark:bg-blue-600 transition-all"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-xs text-neutral-400">{month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 費用内訳 */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
          今月の費用内訳
        </h2>
        <div className="space-y-3">
          {EXPENSE_CATEGORIES.map(({ label, amount, color, pct }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
                <span className="text-neutral-500 tabular-nums">
                  ¥{amount.toLocaleString()} ({pct}%)
                </span>
              </div>
              <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
