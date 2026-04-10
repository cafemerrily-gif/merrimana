"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, X, AlertTriangle, Package } from "lucide-react";
import {
  upsertInventoryItem,
  updateInventoryQuantity,
  deleteInventoryItem,
} from "@/app/actions/store";
import type { InventoryItem } from "../page";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(item: InventoryItem): "ok" | "low" | "critical" {
  const ratio = item.current_quantity / item.min_quantity;
  if (ratio < 1) return "critical";
  if (ratio < 1.5) return "low";
  return "ok";
}

const STATUS_LABEL = { ok: "適正", low: "少なめ", critical: "不足" };
const STATUS_STYLE = {
  ok: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  low: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  critical: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};
const BAR_COLOR = {
  ok: "bg-blue-500",
  low: "bg-yellow-400",
  critical: "bg-red-400",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalState =
  | { mode: "add" }
  | { mode: "edit"; item: InventoryItem }
  | null;

// ── Component ─────────────────────────────────────────────────────────────────

export default function InventoryClient({ items }: { items: InventoryItem[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort();
  const criticalItems = items.filter((i) => getStatus(i) === "critical");
  const filtered =
    categoryFilter === "all" ? items : items.filter((i) => i.category === categoryFilter);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const result = (await deleteInventoryItem(deleteTarget.id)) as { error?: string };
    setLoading(false);
    if (result.error) { setError(result.error); setDeleteTarget(null); return; }
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">在庫管理</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{items.length}品目</p>
        </div>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          品目を追加
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Critical alert */}
      {criticalItems.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 p-4">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">在庫不足のアイテムがあります</p>
            <p className="text-xs text-red-500 mt-0.5">
              {criticalItems.map((i) => i.name).join("、")} — 発注が必要です
            </p>
          </div>
        </div>
      )}

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === "all"
                ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            すべて
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center space-y-2">
          <Package size={32} className="mx-auto text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm text-neutral-400">品目がありません。「品目を追加」から登録してください。</p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="text-left px-4 py-2.5 font-medium text-neutral-500 dark:text-neutral-400">品名</th>
                <th className="text-left px-4 py-2.5 font-medium text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">カテゴリ</th>
                <th className="text-center px-4 py-2.5 font-medium text-neutral-500 dark:text-neutral-400">在庫量</th>
                <th className="text-center px-4 py-2.5 font-medium text-neutral-500 dark:text-neutral-400">状態</th>
                <th className="px-4 py-2.5 hidden lg:table-cell" />
                <th className="px-3 py-2.5 w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const status = getStatus(item);
                const pct = Math.min(100, item.max_quantity > 0 ? (item.current_quantity / item.max_quantity) * 100 : 0);
                return (
                  <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{item.name}</td>
                    <td className="px-4 py-3 text-neutral-500 text-xs hidden sm:table-cell">{item.category}</td>
                    <td className="px-4 py-3 text-center">
                      <QuantityInput item={item} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell min-w-36">
                      <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${BAR_COLOR[status]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                        <span>min {item.min_quantity}</span>
                        <span>max {item.max_quantity}{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setModal({ mode: "edit", item })}
                          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
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
        </div>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <ItemModal
          modal={modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); router.refresh(); }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-xl w-80">
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
              「{deleteTarget.name}」を削除しますか？
            </p>
            <p className="text-xs text-neutral-400 mb-5">削除すると元に戻せません。</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                キャンセル
              </button>
              <button onClick={handleDelete} disabled={loading} className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-40">
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline quantity editor ────────────────────────────────────────────────────

function QuantityInput({ item }: { item: InventoryItem }) {
  const router = useRouter();
  const [val, setVal] = useState(String(item.current_quantity));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = (await updateInventoryQuantity(item.id, parseFloat(val) || 0)) as { error?: string };
    setSaving(false);
    if (!result.error) { setDirty(false); router.refresh(); }
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <input
        type="number"
        value={val}
        step="0.1"
        min="0"
        onChange={(e) => { setVal(e.target.value); setDirty(true); }}
        className="w-20 text-right tabular-nums rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
      <span className="text-xs text-neutral-400">{item.unit}</span>
      {dirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors disabled:opacity-40"
        >
          {saving ? "…" : "保存"}
        </button>
      )}
    </div>
  );
}

// ── Item Modal ────────────────────────────────────────────────────────────────

function ItemModal({
  modal,
  onClose,
  onSaved,
}: {
  modal: { mode: "add" } | { mode: "edit"; item: InventoryItem };
  onClose: () => void;
  onSaved: () => void;
}) {
  const item = modal.mode === "edit" ? modal.item : null;
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [unit, setUnit] = useState(item?.unit ?? "");
  const [minQ, setMinQ] = useState(String(item?.min_quantity ?? ""));
  const [maxQ, setMaxQ] = useState(String(item?.max_quantity ?? ""));
  const [curQ, setCurQ] = useState(String(item?.current_quantity ?? "0"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) { setError("品名は必須です"); return; }
    setSaving(true);
    setError(null);
    const result = (await upsertInventoryItem({
      id: item?.id,
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      min_quantity: parseFloat(minQ) || 0,
      max_quantity: parseFloat(maxQ) || 0,
      current_quantity: parseFloat(curQ) || 0,
    })) as { error?: string };
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {modal.mode === "add" ? "品目を追加" : "品目を編集"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">品名 *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">カテゴリ</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="コーヒー、乳製品…" className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">単位</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg、L、個…" className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">現在の在庫</label>
              <input type="number" step="0.1" min="0" value={curQ} onChange={(e) => setCurQ(e.target.value)} className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">最低在庫（アラート）</label>
              <input type="number" step="0.1" min="0" value={minQ} onChange={(e) => setMinQ(e.target.value)} className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">最大在庫（満杯）</label>
              <input type="number" step="0.1" min="0" value={maxQ} onChange={(e) => setMaxQ(e.target.value)} className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">
            キャンセル
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium">
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
