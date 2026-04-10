"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Clock, Users, X } from "lucide-react";
import { Modal, inputCls, FieldLabel } from "@/components/ui/modal";
import { createRecipe, updateRecipe, deleteRecipe } from "@/app/actions/products";
import type { Recipe } from "@/types/products";

type ProductOption = { id: string; name: string };
type IngredientRow = { name: string; amount: string; cost: string };

const emptyIngredient = (): IngredientRow => ({ name: "", amount: "", cost: "" });

type FormState = {
  product_id: string;
  yield_count: string;
  time_minutes: string;
  ingredients: IngredientRow[];
};

const emptyForm = (): FormState => ({
  product_id: "",
  yield_count: "1",
  time_minutes: "5",
  ingredients: [emptyIngredient()],
});

export default function RecipesClient({
  initialRecipes,
  products,
}: {
  initialRecipes: Recipe[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<
    null | { mode: "add" } | { mode: "edit"; recipe: Recipe }
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setForm(emptyForm());
    setError(null);
    setModal({ mode: "add" });
  };

  const openEdit = (r: Recipe) => {
    setForm({
      product_id: r.product_id,
      yield_count: String(r.yield_count),
      time_minutes: String(r.time_minutes),
      ingredients:
        r.ingredients.length > 0
          ? r.ingredients.map((i) => ({ name: i.name, amount: i.amount, cost: String(i.cost) }))
          : [emptyIngredient()],
    });
    setError(null);
    setModal({ mode: "edit", recipe: r });
  };

  const addIngredient = () =>
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, emptyIngredient()] }));

  const removeIngredient = (idx: number) =>
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));

  const updateIng = (idx: number, key: keyof IngredientRow, value: string) =>
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((ing, i) => (i === idx ? { ...ing, [key]: value } : ing)),
    }));

  const handleSave = () => {
    setError(null);
    if (!form.product_id) return setError("商品を選択してください");
    const yc = parseInt(form.yield_count);
    const tm = parseInt(form.time_minutes);
    if (!yc || yc < 1) return setError("仕込み量は1以上の数値を入力してください");
    if (!tm || tm < 1) return setError("所要時間は1以上の数値を入力してください");

    const ingredients = form.ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name.trim(), amount: i.amount.trim(), cost: parseInt(i.cost) || 0 }));

    startTransition(async () => {
      const data = { product_id: form.product_id, yield_count: yc, time_minutes: tm, ingredients };
      const result = (modal?.mode === "edit"
        ? await updateRecipe(modal.recipe.id, data)
        : await createRecipe(data)) as { error?: string };
      if (result.error) { setError(result.error); return; }
      setModal(null);
      router.refresh();
    });
  };

  const handleDelete = (r: Recipe) => {
    startTransition(async () => {
      const result = await deleteRecipe(r.id) as { error?: string };
      if (result.error) { setError(result.error); return; }
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">レシピ管理</h1>
            <p className="text-sm text-neutral-500 mt-0.5">商品開発ユニット</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            レシピを追加
          </button>
        </div>

        {initialRecipes.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800">
            レシピがまだ登録されていません。「レシピを追加」から作成してください。
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {initialRecipes.map((r) => {
              const totalCost = r.ingredients.reduce((s, i) => s + i.cost, 0);
              const perUnit = r.yield_count > 1 ? Math.round(totalCost / r.yield_count) : totalCost;
              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {r.product?.name ?? "商品未設定"}
                      </h3>
                      <p className="text-xs text-neutral-400">{r.product?.category?.name}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        ¥{perUnit.toLocaleString()}
                        <span className="text-xs font-normal text-neutral-400"> /1個</span>
                      </span>
                      <button
                        onClick={() => openEdit(r)}
                        className="ml-1 p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 px-4 py-2 text-xs text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="flex items-center gap-1"><Clock size={11} />{r.time_minutes}分</span>
                    <span className="flex items-center gap-1"><Users size={11} />{r.yield_count}個分</span>
                    <span>材料費合計 ¥{totalCost.toLocaleString()}</span>
                  </div>
                  <div className="px-4 py-3">
                    {r.ingredients.length === 0 ? (
                      <p className="text-xs text-neutral-400">材料未登録</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {r.ingredients.map((ing) => (
                          <li key={ing.id} className="flex items-center justify-between text-sm">
                            <span className="text-neutral-700 dark:text-neutral-300">{ing.name}</span>
                            <span className="text-neutral-400 tabular-nums">
                              {ing.amount} · ¥{ing.cost}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 追加・編集モーダル */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "レシピを編集" : "レシピを追加"}
      >
        <div className="space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <FieldLabel label="商品 *">
            <select
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className={inputCls()}
            >
              <option value="">商品を選択...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="仕込み量（個数）*">
              <input
                type="number"
                value={form.yield_count}
                onChange={(e) => setForm({ ...form, yield_count: e.target.value })}
                min="1"
                className={inputCls()}
              />
            </FieldLabel>
            <FieldLabel label="所要時間（分）*">
              <input
                type="number"
                value={form.time_minutes}
                onChange={(e) => setForm({ ...form, time_minutes: e.target.value })}
                min="1"
                className={inputCls()}
              />
            </FieldLabel>
          </div>

          {/* 材料リスト */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">材料</label>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus size={12} />
                追加
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_70px_24px] gap-1.5 text-xs text-neutral-400 px-1">
                <span>材料名</span><span>分量</span><span>原価(¥)</span><span />
              </div>
              {form.ingredients.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_70px_24px] gap-1.5 items-center">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIng(idx, "name", e.target.value)}
                    placeholder="例: 牛乳"
                    className={inputCls()}
                  />
                  <input
                    type="text"
                    value={ing.amount}
                    onChange={(e) => updateIng(idx, "amount", e.target.value)}
                    placeholder="200ml"
                    className={inputCls()}
                  />
                  <input
                    type="number"
                    value={ing.cost}
                    onChange={(e) => updateIng(idx, "cost", e.target.value)}
                    placeholder="0"
                    min="0"
                    className={inputCls()}
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    disabled={form.ingredients.length === 1}
                    className="text-neutral-300 hover:text-red-400 disabled:opacity-30 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

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
        title="レシピの削除"
      >
        <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-5">
          「<span className="font-semibold">{deleteTarget?.product?.name ?? "このレシピ"}</span>」のレシピを削除しますか？
          材料データもすべて削除されます。
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
