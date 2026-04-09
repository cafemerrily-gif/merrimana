"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Modal, inputCls, FieldLabel } from "@/components/ui/modal";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/actions/products";
import type { Product, Category, ProductStatus } from "@/types/products";
import { cn } from "@/utils/cn";

const STATUS_OPTIONS: ProductStatus[] = ["販売中", "準備中", "終了"];

const statusStyle: Record<ProductStatus, string> = {
  販売中: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  準備中: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  終了: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

type FormState = {
  name: string;
  category_id: string;
  price: string;
  status: ProductStatus;
};

const emptyForm: FormState = { name: "", category_id: "", price: "", status: "販売中" };

export default function ProductsClient({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("すべて");
  const [modal, setModal] = useState<
    null | { mode: "add" } | { mode: "edit"; product: Product }
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setForm(emptyForm);
    setError(null);
    setModal({ mode: "add" });
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      category_id: p.category_id ?? "",
      price: String(p.price),
      status: p.status,
    });
    setError(null);
    setModal({ mode: "edit", product: p });
  };

  const handleSave = () => {
    setError(null);
    if (!form.name.trim()) return setError("商品名は必須です");
    const price = parseInt(form.price);
    if (!form.price || isNaN(price) || price < 0) return setError("有効な価格を入力してください");

    const data = {
      name: form.name.trim(),
      category_id: form.category_id || null,
      price,
      status: form.status,
    };

    startTransition(async () => {
      try {
        if (modal?.mode === "edit") {
          await updateProduct(modal.product.id, data);
        } else {
          await createProduct(data);
        }
        setModal(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存に失敗しました");
      }
    });
  };

  const handleDelete = (p: Product) => {
    startTransition(async () => {
      try {
        await deleteProduct(p.id);
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "削除に失敗しました");
      }
    });
  };

  const catNames = ["すべて", ...Array.from(new Set(categories.map((c) => c.name)))];
  const filtered = initialProducts
    .filter((p) => p.name.includes(search))
    .filter((p) => catFilter === "すべて" || p.category?.name === catFilter);

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">商品一覧</h1>
            <p className="text-sm text-neutral-500 mt-0.5">商品開発ユニット</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            新規登録
          </button>
        </div>

        {/* 検索・フィルタ */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="商品名で検索..."
              className={inputCls("pl-8")}
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {catNames.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  catFilter === cat
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* テーブル */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-neutral-400">
              {initialProducts.length === 0
                ? "商品がまだ登録されていません。「新規登録」から追加してください。"
                : "条件に一致する商品がありません。"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">商品名</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">カテゴリ</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">価格</th>
                  <th className="text-center px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">ステータス</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{p.name}</td>
                    <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{p.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                      ¥{p.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium", statusStyle[p.status])}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="text-xs text-neutral-400">{filtered.length}件 / 合計 {initialProducts.length}件</p>
      </div>

      {/* 追加・編集モーダル */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "商品を編集" : "商品を追加"}
      >
        <div className="space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <FieldLabel label="商品名 *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例: カフェラテ"
              className={inputCls()}
            />
          </FieldLabel>
          <FieldLabel label="カテゴリ">
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className={inputCls()}
            >
              <option value="">カテゴリなし</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="販売価格（円）*">
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="580"
              min="0"
              className={inputCls()}
            />
          </FieldLabel>
          <FieldLabel label="ステータス">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}
              className={inputCls()}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
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

      {/* 削除確認モーダル */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="商品の削除"
      >
        <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-5">
          「<span className="font-semibold">{deleteTarget?.name}</span>」を削除しますか？
          関連するレシピも削除されます。この操作は取り消せません。
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
