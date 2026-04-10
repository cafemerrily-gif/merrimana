"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Modal, inputCls, FieldLabel } from "@/components/ui/modal";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/products";
import type { Category } from "@/types/products";

type CategoryWithCount = Category & { product_count: number };

const COLOR_OPTIONS = [
  { value: "bg-blue-500", label: "ブルー" },
  { value: "bg-blue-300", label: "ライトブルー" },
  { value: "bg-neutral-600", label: "グレー" },
  { value: "bg-neutral-400", label: "ライトグレー" },
  { value: "bg-purple-500", label: "パープル" },
  { value: "bg-pink-500", label: "ピンク" },
  { value: "bg-orange-500", label: "オレンジ" },
  { value: "bg-green-500", label: "グリーン" },
];

type FormState = { name: string; description: string; color: string };
const emptyForm: FormState = { name: "", description: "", color: "bg-blue-500" };

export default function CategoriesClient({
  initialCategories,
}: {
  initialCategories: CategoryWithCount[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<
    null | { mode: "add" } | { mode: "edit"; category: CategoryWithCount }
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setForm(emptyForm);
    setError(null);
    setModal({ mode: "add" });
  };

  const openEdit = (c: CategoryWithCount) => {
    setForm({ name: c.name, description: c.description, color: c.color });
    setError(null);
    setModal({ mode: "edit", category: c });
  };

  const handleSave = () => {
    setError(null);
    if (!form.name.trim()) return setError("カテゴリ名は必須です");
    startTransition(async () => {
      const data = { name: form.name.trim(), description: form.description.trim(), color: form.color };
      const result = (modal?.mode === "edit"
        ? await updateCategory(modal.category.id, data)
        : await createCategory(data)) as { error?: string };
      if (result.error) { setError(result.error); return; }
      setModal(null);
      router.refresh();
    });
  };

  const handleDelete = (c: CategoryWithCount) => {
    startTransition(async () => {
      const result = await deleteCategory(c.id) as { error?: string };
      if (result.error) { setError(result.error); return; }
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">カテゴリ管理</h1>
            <p className="text-sm text-neutral-500 mt-0.5">商品開発ユニット</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            カテゴリを追加
          </button>
        </div>

        {initialCategories.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800">
            カテゴリがまだ登録されていません。
          </div>
        ) : (
          <div className="space-y-3">
            {initialCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
              >
                <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center shrink-0`}>
                  <Tag size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">{cat.name}</p>
                  <p className="text-sm text-neutral-500 truncate">{cat.description || "説明なし"}</p>
                </div>
                <div className="text-right shrink-0 mr-2">
                  <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{cat.product_count}</p>
                  <p className="text-xs text-neutral-400">商品</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 追加・編集モーダル */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "カテゴリを編集" : "カテゴリを追加"}
      >
        <div className="space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <FieldLabel label="カテゴリ名 *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例: ドリンク"
              className={inputCls()}
            />
          </FieldLabel>
          <FieldLabel label="説明">
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="例: コーヒー・ラテ・ジュースなどの飲み物"
              className={inputCls()}
            />
          </FieldLabel>
          <FieldLabel label="カラー">
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  title={label}
                  onClick={() => setForm({ ...form, color: value })}
                  className={`w-7 h-7 rounded-full ${value} transition-transform ${form.color === value ? "ring-2 ring-offset-2 ring-blue-600 scale-110" : "hover:scale-105"}`}
                />
              ))}
            </div>
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
        title="カテゴリの削除"
      >
        <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
          「<span className="font-semibold">{deleteTarget?.name}</span>」を削除しますか？
        </p>
        {deleteTarget && deleteTarget.product_count > 0 && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 mb-4">
            このカテゴリには {deleteTarget.product_count} 件の商品が紐付いています。削除すると商品のカテゴリが未設定になります。
          </p>
        )}
        <div className="flex justify-end gap-2 mt-5">
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
