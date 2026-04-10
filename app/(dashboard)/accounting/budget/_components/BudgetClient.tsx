"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Modal, inputCls, FieldLabel } from "@/components/ui/modal";
import { upsertBudget } from "@/app/actions/accounting";
import type { BudgetRow } from "../page";

export default function BudgetClient({
  budgetRows,
  year,
  month,
  dbError,
}: {
  budgetRows: BudgetRow[];
  year: number;
  month: number;
  dbError: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editTarget, setEditTarget] = useState<BudgetRow | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState<string | null>(null);

  const openEdit = (row: BudgetRow) => {
    setInputVal(String(row.budget));
    setError(null);
    setEditTarget(row);
  };

  const handleSave = () => {
    if (!editTarget) return;
    const amount = parseInt(inputVal);
    if (isNaN(amount) || amount < 0) return setError("0以上の金額を入力してください");

    startTransition(async () => {
      const result = await upsertBudget({ year, month, category: editTarget.category, amount }) as { error?: string };
      if (result.error) { setError(result.error); return; }
      setEditTarget(null);
      router.refresh();
    });
  };

  const revenueRow = budgetRows.find((r) => r.category === "売上高");
  const profitRow = budgetRows.find((r) => r.category === "営業利益");

  const salesAchievement =
    revenueRow && revenueRow.budget > 0
      ? ((revenueRow.actual / revenueRow.budget) * 100).toFixed(1)
      : null;

  const profitAchievement =
    profitRow && profitRow.budget > 0
      ? ((profitRow.actual / profitRow.budget) * 100).toFixed(1)
      : null;

  const costRows = budgetRows.filter((r) => r.type === "cost");
  const totalBudgetCost = costRows.reduce((s, r) => s + r.budget, 0);
  const totalActualCost = costRows.reduce((s, r) => s + r.actual, 0);
  const costConsumption =
    totalBudgetCost > 0
      ? ((totalActualCost / totalBudgetCost) * 100).toFixed(1)
      : null;

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">予算管理</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {year}年{month}月度
          </p>
        </div>

        {dbError ? (
          <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800">
            データを取得できませんでした。Supabaseの接続設定を確認してください。
          </div>
        ) : (
          <>
            {/* 達成率サマリー */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "売上達成率",
                  value: salesAchievement ? `${salesAchievement}%` : "—",
                  ok: salesAchievement ? parseFloat(salesAchievement) >= 100 : null,
                },
                {
                  label: "費用予算消化率",
                  value: costConsumption ? `${costConsumption}%` : "—",
                  ok: costConsumption ? parseFloat(costConsumption) <= 100 : null,
                },
                {
                  label: "利益目標達成率",
                  value: profitAchievement ? `${profitAchievement}%` : "—",
                  ok: profitAchievement ? parseFloat(profitAchievement) >= 100 : null,
                },
              ].map(({ label, value, ok }) => (
                <div
                  key={label}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-center"
                >
                  <p
                    className={`text-2xl font-bold ${
                      ok === null
                        ? "text-neutral-400"
                        : ok
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-red-500"
                    }`}
                  >
                    {value}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* 予算 vs 実績テーブル */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  今月の予算対比
                </h2>
                <p className="text-xs text-neutral-400">
                  鉛筆アイコンで予算を設定できます
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                      項目
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                      予算
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                      実績
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">
                      差異
                    </th>
                    <th className="px-4 py-3 w-28 hidden lg:table-cell" />
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {budgetRows.map((row) => {
                    const diff = row.actual - row.budget;
                    const isRevenue = row.type === "revenue" || row.type === "profit";
                    const isGood = row.budget === 0 ? null : isRevenue ? diff >= 0 : diff <= 0;
                    const pct =
                      row.budget > 0
                        ? Math.min(
                            100,
                            (Math.min(row.actual, row.budget) / Math.max(row.actual, row.budget)) *
                              100
                          )
                        : 0;
                    return (
                      <tr
                        key={row.category}
                        className={[
                          "border-b border-neutral-100 dark:border-neutral-800 last:border-0",
                          row.type === "profit" ? "bg-blue-50 dark:bg-blue-900/10" : "",
                        ].join(" ")}
                      >
                        <td
                          className={`px-4 py-2.5 ${
                            row.type === "profit"
                              ? "font-semibold text-neutral-800 dark:text-neutral-200"
                              : "text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          {row.category}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-neutral-500">
                          {row.budget > 0 ? `¥${row.budget.toLocaleString()}` : (
                            <span className="text-neutral-300 dark:text-neutral-600 text-xs">未設定</span>
                          )}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                            row.type === "profit"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-neutral-800 dark:text-neutral-200"
                          }`}
                        >
                          ¥{row.actual.toLocaleString()}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right tabular-nums font-medium hidden sm:table-cell ${
                            isGood === null
                              ? "text-neutral-400"
                              : isGood
                              ? "text-blue-500"
                              : "text-red-400"
                          }`}
                        >
                          {row.budget > 0
                            ? `${diff > 0 ? "+" : ""}¥${diff.toLocaleString()}`
                            : ""}
                        </td>
                        <td className="px-4 py-2.5 hidden lg:table-cell">
                          {row.budget > 0 && (
                            <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isGood ? "bg-blue-500" : "bg-red-400"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.type !== "profit" && (
                            <button
                              onClick={() => openEdit(row)}
                              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-neutral-400">
              ※ 営業利益の予算は売上高予算から費用予算を差し引いて自動計算されます。
            </p>
          </>
        )}
      </div>

      {/* 予算編集モーダル */}
      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={`予算を設定：${editTarget?.category}`}
      >
        <div className="space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <FieldLabel label={`${year}年${month}月の予算（円）`}>
            <input
              type="number"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              min="0"
              placeholder="例: 2700000"
              className={inputCls()}
            />
          </FieldLabel>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setEditTarget(null)}
              className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isPending ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
