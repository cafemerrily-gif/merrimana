"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, TrendingUp, Users, DollarSign, ChevronDown, ChevronRight, Minus } from "lucide-react";
import { Modal, inputCls, FieldLabel } from "@/components/ui/modal";
import { createSale, updateSale, deleteSale } from "@/app/actions/accounting";
import type { Sale, MonthlySale, ProductForSale } from "@/types/accounting";

type ItemQuantity = {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
};

type FormState = {
  date: string;
  customer_count: string;
  notes: string;
  quantities: ItemQuantity[];
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function getAvailableProducts(products: ProductForSale[], date: string): ProductForSale[] {
  return products.filter((p) => {
    if (p.status === "終了") return false;
    if (p.sale_start && p.sale_start > date) return false;
    if (p.sale_end && p.sale_end < date) return false;
    return true;
  });
}

function buildQuantities(
  products: ProductForSale[],
  date: string,
  existingItems?: { product_id: string; quantity: number }[]
): ItemQuantity[] {
  return getAvailableProducts(products, date).map((p) => {
    const existing = existingItems?.find((i) => i.product_id === p.id);
    return {
      product_id: p.id,
      product_name: p.name,
      unit_price: p.price,
      quantity: existing?.quantity ?? 0,
    };
  });
}

export default function SalesClient({
  sales,
  monthlySummary,
  products,
  dbError,
}: {
  sales: Sale[];
  monthlySummary: MonthlySale[];
  products: ProductForSale[];
  dbError: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<null | { mode: "add" } | { mode: "edit"; sale: Sale }>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [form, setForm] = useState<FormState>({
    date: todayStr(),
    customer_count: "",
    notes: "",
    quantities: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const openAdd = () => {
    const today = todayStr();
    setForm({
      date: today,
      customer_count: "",
      notes: "",
      quantities: buildQuantities(products, today),
    });
    setError(null);
    setModal({ mode: "add" });
  };

  const openEdit = (s: Sale) => {
    setForm({
      date: s.date,
      customer_count: String(s.customer_count),
      notes: s.notes,
      quantities: buildQuantities(products, s.date, s.sale_items),
    });
    setError(null);
    setModal({ mode: "edit", sale: s });
  };

  const handleDateChange = (date: string) => {
    setForm((f) => ({
      ...f,
      date,
      quantities: buildQuantities(products, date, f.quantities),
    }));
  };

  const setQty = (product_id: string, quantity: number) => {
    setForm((f) => ({
      ...f,
      quantities: f.quantities.map((q) =>
        q.product_id === product_id ? { ...q, quantity: Math.max(0, quantity) } : q
      ),
    }));
  };

  const total = form.quantities.reduce((s, q) => s + q.unit_price * q.quantity, 0);
  const itemCount = form.quantities.filter((q) => q.quantity > 0).length;

  const handleSave = () => {
    setError(null);
    if (!form.date) return setError("日付を入力してください");
    if (itemCount === 0) return setError("少なくとも1つの商品の数量を入力してください");

    startTransition(async () => {
      try {
        const items = form.quantities
          .filter((q) => q.quantity > 0)
          .map((q) => ({
            product_id: q.product_id,
            product_name: q.product_name,
            unit_price: q.unit_price,
            quantity: q.quantity,
            subtotal: q.unit_price * q.quantity,
          }));

        const data = {
          date: form.date,
          amount: total,
          customer_count: parseInt(form.customer_count) || 0,
          notes: form.notes,
          items,
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

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
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
                      <th className="px-4 py-3 w-8" />
                      <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">日付</th>
                      <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">売上</th>
                      <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">来客数</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden md:table-cell">商品</th>
                      <th className="px-4 py-3 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => {
                      const isExpanded = expandedIds.has(s.id);
                      const hasItems = s.sale_items && s.sale_items.length > 0;
                      const itemSummary = hasItems
                        ? s.sale_items
                            .slice(0, 2)
                            .map((i) => `${i.product_name}×${i.quantity}`)
                            .join("、") +
                          (s.sale_items.length > 2 ? ` ほか${s.sale_items.length - 2}種` : "")
                        : "—";

                      return (
                        <>
                          <tr
                            key={s.id}
                            className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              {hasItems && (
                                <button
                                  onClick={() => toggleExpand(s.id)}
                                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                                >
                                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-neutral-400 tabular-nums">{s.date}</td>
                            <td className="px-4 py-3 text-right font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                              ¥{s.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-neutral-500 hidden sm:table-cell">
                              {s.customer_count > 0 ? `${s.customer_count}名` : "—"}
                            </td>
                            <td className="px-4 py-3 text-neutral-400 text-xs hidden md:table-cell truncate max-w-xs">
                              {itemSummary}
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
                          {isExpanded && hasItems && (
                            <tr key={`${s.id}-detail`} className="bg-neutral-50 dark:bg-neutral-800/30 border-b border-neutral-100 dark:border-neutral-800">
                              <td colSpan={6} className="px-8 py-3">
                                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 gap-y-1 text-xs max-w-md">
                                  <span className="text-neutral-400 font-medium">商品名</span>
                                  <span className="text-neutral-400 font-medium text-right">単価</span>
                                  <span className="text-neutral-400 font-medium text-right">個数</span>
                                  <span className="text-neutral-400 font-medium text-right">小計</span>
                                  {s.sale_items.map((item) => (
                                    <>
                                      <span key={`name-${item.id}`} className="text-neutral-700 dark:text-neutral-300">{item.product_name}</span>
                                      <span key={`price-${item.id}`} className="tabular-nums text-neutral-500 text-right">¥{item.unit_price.toLocaleString()}</span>
                                      <span key={`qty-${item.id}`} className="tabular-nums text-neutral-500 text-right">{item.quantity}</span>
                                      <span key={`sub-${item.id}`} className="tabular-nums text-neutral-700 dark:text-neutral-300 text-right font-medium">¥{item.subtotal.toLocaleString()}</span>
                                    </>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* 売上入力モーダル */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "売上を編集" : "売上を入力"}
      >
        <div className="space-y-5">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="日付 *">
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleDateChange(e.target.value)}
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
          </div>

          {/* 商品別数量入力 */}
          <div>
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              販売数量（この日付で販売中の商品）
            </p>
            {form.quantities.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg">
                この日付に販売中の商品がありません。
                <br />
                商品管理で販売期間を設定してください。
              </div>
            ) : (
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto] gap-0 text-xs font-medium text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
                  <span>商品名 / 単価</span>
                  <span className="w-28 text-center">個数</span>
                  <span className="w-20 text-right">小計</span>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {form.quantities.map((q) => (
                    <div
                      key={q.product_id}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm text-neutral-800 dark:text-neutral-200 font-medium">
                          {q.product_name}
                        </p>
                        <p className="text-xs text-neutral-400 tabular-nums">
                          ¥{q.unit_price.toLocaleString()}
                        </p>
                      </div>
                      {/* ステッパー */}
                      <div className="flex items-center gap-1 w-28">
                        <button
                          type="button"
                          onClick={() => setQty(q.product_id, q.quantity - 1)}
                          disabled={q.quantity === 0}
                          className="w-7 h-7 rounded border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          value={q.quantity === 0 ? "" : q.quantity}
                          onChange={(e) =>
                            setQty(q.product_id, parseInt(e.target.value) || 0)
                          }
                          min="0"
                          placeholder="0"
                          className="w-12 text-center text-sm tabular-nums rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => setQty(q.product_id, q.quantity + 1)}
                          className="w-7 h-7 rounded border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="w-20 text-right tabular-nums text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {q.quantity > 0 ? `¥${(q.unit_price * q.quantity).toLocaleString()}` : "—"}
                      </div>
                    </div>
                  ))}
                </div>
                {/* 合計 */}
                <div className="flex items-center justify-between px-3 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    合計 {itemCount > 0 ? `（${itemCount}種類）` : ""}
                  </span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                    ¥{total.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <FieldLabel label="メモ">
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="特記事項など"
              className={inputCls()}
            />
          </FieldLabel>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setModal(null)}
              className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isPending || form.quantities.length === 0}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isPending ? "保存中..." : `¥${total.toLocaleString()} を記録`}
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
