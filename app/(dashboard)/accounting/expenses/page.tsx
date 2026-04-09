import { Plus } from "lucide-react";

const EXPENSES = [
  { id: 1, date: "2026/04/09", category: "原材料費", description: "コーヒー豆（エチオピア産）20kg", amount: 48000, vendor: "丸山珈琲" },
  { id: 2, date: "2026/04/08", category: "人件費", description: "4月第2週 アルバイト給与", amount: 182000, vendor: "社内" },
  { id: 3, date: "2026/04/07", category: "消耗品費", description: "テイクアウトカップ・袋 補充", amount: 12400, vendor: "アスクル" },
  { id: 4, date: "2026/04/06", category: "原材料費", description: "牛乳・生クリーム", amount: 31500, vendor: "明治フードマテリア" },
  { id: 5, date: "2026/04/05", category: "光熱費", description: "電気代（3月分）", amount: 87000, vendor: "東京電力" },
  { id: 6, date: "2026/04/04", category: "原材料費", description: "小麦粉・砂糖・バター", amount: 22800, vendor: "富澤商店" },
  { id: 7, date: "2026/04/03", category: "家賃", description: "4月分家賃", amount: 280000, vendor: "不動産管理会社" },
  { id: 8, date: "2026/04/02", category: "修繕費", description: "エスプレッソマシン定期メンテ", amount: 35000, vendor: "デロンギ" },
];

const CATEGORY_TOTALS = [
  { label: "原材料費", amount: 854000, color: "bg-blue-500" },
  { label: "人件費", amount: 730000, color: "bg-neutral-600 dark:bg-neutral-400" },
  { label: "家賃・光熱費", amount: 487000, color: "bg-blue-300" },
  { label: "消耗品・その他", amount: 365000, color: "bg-neutral-400" },
];

const categoryColors: Record<string, string> = {
  原材料費: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  人件費: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  消耗品費: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  光熱費: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  家賃: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  修繕費: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const total = CATEGORY_TOTALS.reduce((s, c) => s + c.amount, 0);

export default function ExpensesPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">支出管理</h1>
          <p className="text-sm text-neutral-500 mt-0.5">会計・経営戦略ユニット</p>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={15} />
          支出を記録
        </button>
      </div>

      {/* カテゴリ別内訳 */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">今月の支出内訳</h2>
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            ¥{total.toLocaleString()}
          </span>
        </div>
        <div className="space-y-3">
          {CATEGORY_TOTALS.map(({ label, amount, color }) => {
            const pct = Math.round((amount / total) * 100);
            return (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
                  <span className="text-neutral-500 tabular-nums">¥{amount.toLocaleString()} ({pct}%)</span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 明細テーブル */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">支出明細（今月）</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">日付</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">カテゴリ</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">内容</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden md:table-cell">取引先</th>
              <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">金額</th>
            </tr>
          </thead>
          <tbody>
            {EXPENSES.map((e) => (
              <tr key={e.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <td className="px-4 py-3 text-xs text-neutral-400 tabular-nums">{e.date}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[e.category] ?? ""}`}>
                    {e.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{e.description}</td>
                <td className="px-4 py-3 text-neutral-500 text-xs hidden md:table-cell">{e.vendor}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                  ¥{e.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
