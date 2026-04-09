const BUDGET_ITEMS = [
  { label: "売上高", budget: 2700000, actual: 2841000, type: "revenue" },
  { label: "原材料費", budget: 810000, actual: 854000, type: "cost" },
  { label: "人件費", budget: 720000, actual: 730000, type: "cost" },
  { label: "家賃", budget: 280000, actual: 280000, type: "cost" },
  { label: "光熱費", budget: 100000, actual: 87000, type: "cost" },
  { label: "消耗品費", budget: 20000, actual: 12400, type: "cost" },
  { label: "修繕費", budget: 50000, actual: 35000, type: "cost" },
  { label: "その他経費", budget: 200000, actual: 151600, type: "cost" },
  { label: "営業利益", budget: 520000, actual: 691000, type: "profit" },
];

const MONTHLY_BUDGET = [
  { month: "4月", budget: 2700000, actual: 2841000 },
  { month: "5月", budget: 2800000, actual: null },
  { month: "6月", budget: 2900000, actual: null },
  { month: "7月", budget: 3200000, actual: null },
  { month: "8月", budget: 3500000, actual: null },
  { month: "9月", budget: 3000000, actual: null },
];

const maxVal = Math.max(...MONTHLY_BUDGET.map((d) => d.budget));

export default function BudgetPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">予算管理</h1>
        <p className="text-sm text-neutral-500 mt-0.5">2026年度 上半期</p>
      </div>

      {/* 達成率サマリー */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "売上達成率", value: "105.2%", ok: true },
          { label: "費用予算消化率", value: "96.3%", ok: true },
          { label: "利益目標達成率", value: "132.9%", ok: true },
        ].map(({ label, value, ok }) => (
          <div key={label} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-center">
            <p className={`text-2xl font-bold ${ok ? "text-blue-600 dark:text-blue-400" : "text-red-500"}`}>{value}</p>
            <p className="text-xs text-neutral-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* 予算 vs 実績テーブル */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">今月の予算対比</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">項目</th>
              <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">予算</th>
              <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">実績</th>
              <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">差異</th>
              <th className="px-4 py-3 w-32 hidden lg:table-cell" />
            </tr>
          </thead>
          <tbody>
            {BUDGET_ITEMS.map((item) => {
              const diff = item.actual - item.budget;
              const isRevenue = item.type === "revenue" || item.type === "profit";
              const isGood = isRevenue ? diff >= 0 : diff <= 0;
              const pct = Math.min(100, (Math.min(item.actual, item.budget) / Math.max(item.actual, item.budget)) * 100);
              return (
                <tr key={item.label} className={`border-b border-neutral-100 dark:border-neutral-800 last:border-0 ${item.type === "profit" ? "bg-blue-50 dark:bg-blue-900/10" : ""}`}>
                  <td className={`px-4 py-2.5 ${item.type === "profit" ? "font-semibold text-neutral-800 dark:text-neutral-200" : "text-neutral-700 dark:text-neutral-300"}`}>
                    {item.label}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-neutral-500">¥{item.budget.toLocaleString()}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${item.type === "profit" ? "text-blue-600 dark:text-blue-400" : "text-neutral-800 dark:text-neutral-200"}`}>
                    ¥{item.actual.toLocaleString()}
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${isGood ? "text-blue-500" : "text-red-400"}`}>
                    {diff > 0 ? "+" : ""}¥{diff.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isGood ? "bg-blue-500" : "bg-red-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 月次予算推移 */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">上半期 売上予算推移</h2>
        <div className="flex items-end gap-3 h-32">
          {MONTHLY_BUDGET.map(({ month, budget, actual }) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-neutral-400">{(budget / 10000).toFixed(0)}万</span>
              <div className="w-full relative flex items-end" style={{ height: "80px" }}>
                <div
                  className="w-full rounded-t bg-neutral-200 dark:bg-neutral-700"
                  style={{ height: `${(budget / maxVal) * 100}%` }}
                />
                {actual !== null && (
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t bg-blue-500"
                    style={{ height: `${(actual / maxVal) * 100}%` }}
                  />
                )}
              </div>
              <span className="text-xs text-neutral-400">{month}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-blue-500 inline-block" />実績</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-neutral-300 dark:bg-neutral-600 inline-block" />予算</span>
        </div>
      </div>
    </div>
  );
}
