"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, TrendingUp, Users, DollarSign } from "lucide-react";
import { Modal, inputCls, FieldLabel } from "@/components/ui/modal";
import { createSale, updateSale, deleteSale } from "@/app/actions/accounting";
import type { Sale, MonthlySale } from "@/types/accounting";

type FormState = {
  date: string;
  amount: string;
  customer_count: string;
  notes: string;
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

const emptyForm = (): FormState => ({
  date: todayStr(),
  amount: "",
  customer_count: "",
  notes: "",
});

export default function SalesClient({
  sales,
  monthlySummary,
  dbError,
}: {
  sales: Sale[];
  monthlySummary: MonthlySale[];
  dbError: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<null | { mode: "add" } | { mode: "edit"; sale: Sale }>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setForm(emptyForm());
    setError(null);
    setModal({ mode: "add" });
  };

  const openEdit = (s: Sale) => {
    setForm({
      date: s.date,
      amount: String(s.amount),
      customer_count: String(s.customer_count),
      notes: s.notes,
    });
    setError(null);
    setModal({ mode: "edit", sale: s });
  };

  const handleSave = () => {
    setError(null);
    const amount = parseInt(form.amount);
    if (!form.date) return setError("日付を入力してください");
    if (isNaN(amount) || amount < 0) return setError("売上金額を正しく入力してください");

    startTransition(async () => {
      try {
        const data = {
          date: form.date,
          amount,
          customer_count: parseInt(form.customer_count) || 0,
          notes: form.notes,
        };
        if (modal?.mode === "edit") {
          await updateSale(modal.sale.id, data);
        } else {
          await createSale(data);
        }
        setModal(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存に失敗しました");
      }
    });
  };

  const handleDelete = (s: Sale) => {
    startTransition(async () => {
      try {
        await deleteSale(s.id);
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "削除に失敗しました");
      }
    });
  };

  const totalAmount = sales.reduce((s, r) => s + r.amount, 0);
  const totalCustomers = sales.reduce((s, r) => s + r.customer_count, 0);
  const avgPerCustomer = totalCustomers > 0 ? Math.round(totalAmount / totalCustomers) : null;
  const maxAmount = Math.max(...monthlySummary.map((m) => m.amount), 1);

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">売上管理</h1>
            <p className="text-sm text-neutral-500 mt-0.5">会計・経営戦略ユニット</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            売上を入力
          </button>
        </div>

        {dbError ? (
          <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800">
            データを取得できませんでした。Supabaseの接続設定を確認してください。
          </div>
        ) : (
          <>
            {/* サマリーカード */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: "今月売上合計", value: `¥${totalAmount.toLocaleString()}`, icon: DollarSign },
                { label: "今月来客数", value: `${totalCustomers.toLocaleString()}名`, icon: Users },
                {
                  label: "客単価",
                  value: avgPerCustomer ? `¥${avgPerCustomer.toLocaleString()}` : "—",
                  icon: TrendingUp,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-neutral-400">{label}</p>
                    <Icon size={14} className="text-neutral-400" />
                  </div>
                  <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
                </div>
              ))}
            </div>

            {/* 月次グラフ */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                月次売上推移（直近6ヶ月）
              </h2>
              <div className="flex items-end gap-3 h-40">
                {monthlySummary.map(({ label, amount }) => {
                  const heightPct = (amount / maxAmount) * 100;
                  return (
                    <div key={label} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-xs text-neutral-500 tabular-nums">
                        {amount > 0 ? `${(amount / 10000).toFixed(0)}万` : ""}
                      </span>
                      <div className="w-full flex items-end" style={{ height: "100px" }}>
                        <div
                          className="w-full rounded-t bg-blue-500 dark:bg-blue-600 transition-all"
                          style={{ height: `${Math.max(heightPct, amount > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-400">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 日別売上テーブル */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  今月の売上明細
                </h2>
              </div>
              {sales.length === 0 ? (
                <div className="py-16 text-center text-sm text-neutral-400">
                  売上データがありません。「売上を入力」から記録してください。
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                      <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                        日付
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                        売上
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">
                        来客数
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">
                        客単価
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden md:table-cell">
                        メモ
                      </th>
                      <th className="px-4 py-3 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => {
                      const unitPrice =
                        s.customer_count > 0 ? Math.round(s.amount / s.customer_count) : null;
                      return (
                        <tr
                          key={s.id}
                          className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-xs text-neutral-400 tabular-nums">
                            {s.date}
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                            ¥{s.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-neutral-500 hidden sm:table-cell">
                            {s.customer_count > 0 ? `${s.customer_count}名` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-neutral-500 hidden sm:table-cell">
                            {unitPrice ? `¥${unitPrice.toLocaleString()}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-neutral-400 text-xs hidden md:table-cell">
                            {s.notes || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(s)}
                                className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(s)}
                                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
        title={modal?.mode === "edit" ? "売上を編集" : "売上を入力"}
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
          <FieldLabel label="売上金額（円）*">
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              min="0"
              placeholder="例: 150000"
              className={inputCls()}
            />
          </FieldLabel>
          <FieldLabel label="来客数（名）">
            <input
              type="number"
              value={form.customer_count}
              onChange={(e) => setForm({ ...form, customer_count: e.target.value })}
              min="0"
              placeholder="0"
              className={inputCls()}
            />
          </FieldLabel>
          <FieldLabel label="メモ">
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="特記事項など"
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
        title="売上記録の削除"
      >
        <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-5">
          <span className="font-semibold">{deleteTarget?.date}</span> の売上記録（¥
          {deleteTarget?.amount.toLocaleString()}）を削除しますか？
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
