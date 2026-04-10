"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal, inputCls, FieldLabel } from "@/components/ui/modal";
import { createExpense, updateExpense, deleteExpense } from "@/app/actions/accounting";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_COLORS } from "@/types/accounting";
import type { Expense } from "@/types/accounting";
import type { CategoryTotal } from "../page";

type FormState = {
  date: string;
  category: string;
  description: string;
  vendor: string;
  amount: string;
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

const emptyForm = (): FormState => ({
  date: todayStr(),
  category: EXPENSE_CATEGORIES[0],
  description: "",
  vendor: "",
  amount: "",
});

const BAR_COLORS = [
  "bg-blue-500",
  "bg-neutral-600 dark:bg-neutral-400",
  "bg-pink-400",
  "bg-orange-400",
  "bg-purple-400",
  "bg-yellow-400",
  "bg-neutral-400",
];

export default function ExpensesClient({
  expenses,
  categoryTotals,
  dbError,
}: {
  expenses: Expense[];
  categoryTotals: CategoryTotal[];
  dbError: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<
    null | { mode: "add" } | { mode: "edit"; expense: Expense }
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setForm(emptyForm());
    setError(null);
    setModal({ mode: "add" });
  };

  const openEdit = (e: Expense) => {
    setForm({
      date: e.date,
      category: e.category,
      description: e.description,
      vendor: e.vendor,
      amount: String(e.amount),
    });
    setError(null);
    setModal({ mode: "edit", expense: e });
  };

  const handleSave = () => {
    setError(null);
    const amount = parseInt(form.amount);
    if (!form.date) return setError("日付を入力してください");
    if (!form.description.trim()) return setError("内容を入力してください");
    if (isNaN(amount) || amount < 0) return setError("金額を正しく入力してください");

    startTransition(async () => {
      const data = {
        date: form.date,
        category: form.category,
        description: form.description.trim(),
        vendor: form.vendor.trim(),
        amount,
      };
      if (modal?.mode === "edit") {
        const result = await updateExpense(modal.expense.id, data) as { error?: string };
        if (result.error) { setError(result.error); return; }
      } else {
        const result = await createExpense(data) as { error?: string };
        if (result.error) { setError(result.error); return; }
      }
      setModal(null);
      router.refresh();
    });
  };

  const handleDelete = (e: Expense) => {
    startTransition(async () => {
      const result = await deleteExpense(e.id) as { error?: string };
      if (result.error) { setError(result.error); return; }
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const totalExpenses = categoryTotals.reduce((s, c) => s + c.amount, 0);

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">支出管理</h1>
            <p className="text-sm text-neutral-500 mt-0.5">会計・経営戦略ユニット</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            支出を記録
          </button>
        </div>

        {dbError ? (
          <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800">
            データを取得できませんでした。Supabaseの接続設定を確認してください。
          </div>
        ) : (
          <>
            {/* カテゴリ別内訳 */}
            {categoryTotals.length > 0 && (
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    今月の支出内訳
                  </h2>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    ¥{totalExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-3">
                  {categoryTotals.map(({ category, amount }, idx) => {
                    const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                    const barColor = BAR_COLORS[idx % BAR_COLORS.length];
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-700 dark:text-neutral-300">{category}</span>
                          <span className="text-neutral-500 tabular-nums">
                            ¥{amount.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 明細テーブル */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  支出明細（今月）
                </h2>
              </div>
              {expenses.length === 0 ? (
                <div className="py-16 text-center text-sm text-neutral-400">
                  支出データがありません。「支出を記録」から入力してください。
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                      <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                        日付
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                        カテゴリ
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                        内容
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden md:table-cell">
                        取引先
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                        金額
                      </th>
                      <th className="px-4 py-3 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-neutral-400 tabular-nums">
                          {e.date}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              EXPENSE_CATEGORY_COLORS[e.category] ??
                              "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                            }`}
                          >
                            {e.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                          {e.description}
                        </td>
                        <td className="px-4 py-3 text-neutral-500 text-xs hidden md:table-cell">
                          {e.vendor || "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                          ¥{e.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(e)}
                              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(e)}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* 追加・編集モーダル */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "支出を編集" : "支出を記録"}
      >
        <div className="space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <FieldLabel label="日付 *">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputCls()}
            />
          </FieldLabel>
          <FieldLabel label="カテゴリ *">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputCls()}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="内容 *">
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="例: コーヒー豆 20kg"
              className={inputCls()}
            />
          </FieldLabel>
          <FieldLabel label="取引先">
            <input
              type="text"
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              placeholder="例: 丸山珈琲"
              className={inputCls()}
            />
          </FieldLabel>
          <FieldLabel label="金額（円）*">
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              min="0"
              placeholder="例: 48000"
              className={inputCls()}
            />
          </FieldLabel>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModal(null)}
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

      {/* 削除確認 */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="支出記録の削除"
      >
        <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-5">
          「<span className="font-semibold">{deleteTarget?.description}</span>
          」（¥{deleteTarget?.amount.toLocaleString()}）を削除しますか？
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={() => deleteTarget && handleDelete(deleteTarget)}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {isPending ? "削除中..." : "削除する"}
          </button>
        </div>
      </Modal>
    </>
  );
}
