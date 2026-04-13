"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, ChevronRight, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { createTrial, updateTrial, deleteTrial } from "@/app/actions/product-trials";
import type { ProductTrial, TrialCategory, TrialIngredient, TrialPurchase } from "@/types/product-trial";
import { TRIAL_CATEGORIES, CATEGORY_COLOR } from "@/types/product-trial";

// ----------------------------------------------------------------
// 型・初期値
// ----------------------------------------------------------------

type FormState = {
  name: string;
  category: TrialCategory;
  concept: string;
  target: string;
  pr_points: string;
  desired_price: string;
  packaging_cost: string;
  prep_notes: string;
  steps: string[];
  good_points: string;
  concerns: string;
  improvements: string;
  ingredients: TrialIngredient[];
  purchases: TrialPurchase[];
};

const emptyIngredient = (): TrialIngredient => ({ name: "", amount_g: 0, cost: 0, sort_order: 0 });
const emptyPurchase = (): TrialPurchase => ({ material: "", amount: 0, cost_per_g: 0, supplier: "", sort_order: 0 });

const emptyForm = (category: TrialCategory = "ドリンク"): FormState => ({
  name: "",
  category,
  concept: "",
  target: "",
  pr_points: "",
  desired_price: "",
  packaging_cost: "0",
  prep_notes: "",
  steps: ["", "", "", "", ""],
  good_points: "",
  concerns: "",
  improvements: "",
  ingredients: [emptyIngredient()],
  purchases: [emptyPurchase()],
});

function trialToForm(t: ProductTrial): FormState {
  const ings = [...(t.product_trial_ingredients ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const purs = [...(t.product_trial_purchases ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  return {
    name: t.name,
    category: t.category,
    concept: t.concept,
    target: t.target,
    pr_points: t.pr_points,
    desired_price: t.desired_price > 0 ? String(t.desired_price) : "",
    packaging_cost: String(t.packaging_cost),
    prep_notes: t.prep_notes,
    steps: t.steps.length === 5 ? t.steps : ["", "", "", "", ""],
    good_points: t.good_points,
    concerns: t.concerns,
    improvements: t.improvements,
    ingredients: ings.length > 0 ? ings : [emptyIngredient()],
    purchases: purs.length > 0 ? purs : [emptyPurchase()],
  };
}

// ----------------------------------------------------------------
// 計算ヘルパー
// ----------------------------------------------------------------

function calcCost(ingredients: TrialIngredient[], packagingCost: string): number {
  return ingredients.reduce((sum, i) => sum + (Number(i.cost) || 0), 0) + (Number(packagingCost) || 0);
}

function calcCostRate(cost: number, desiredPrice: string): string {
  const price = Number(desiredPrice);
  if (!price || price === 0) return "—";
  return ((cost / price) * 100).toFixed(1) + "%";
}

// ----------------------------------------------------------------
// スタイルヘルパー
// ----------------------------------------------------------------

const labelCls = "text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block";
const inputCls =
  "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const textareaCls = inputCls + " resize-none";
const cellInputCls =
  "w-full rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition";
const sectionTitle = "text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3";
const cardCls =
  "rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3";

// ----------------------------------------------------------------
// メインコンポーネント
// ----------------------------------------------------------------

export default function TrialsClient({ initialTrials }: { initialTrials: ProductTrial[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [trials, setTrials] = useState<ProductTrial[]>(initialTrials);
  const [selected, setSelected] = useState<ProductTrial | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<TrialCategory | "すべて">("すべて");

  const colors = CATEGORY_COLOR[form.category];
  const cost = calcCost(form.ingredients, form.packaging_cost);
  const costRate = calcCostRate(cost, form.desired_price);

  // -- フォームオープン --
  function openNew() {
    setSelected(null);
    setIsNew(true);
    setForm(emptyForm());
    setError(null);
  }

  function openEdit(trial: ProductTrial) {
    setSelected(trial);
    setIsNew(false);
    setForm(trialToForm(trial));
    setError(null);
  }

  function closeForm() {
    setSelected(null);
    setIsNew(false);
    setError(null);
  }

  // -- フィールド更新 --
  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  function setStep(idx: number, val: string) {
    setForm((prev) => {
      const steps = [...prev.steps];
      steps[idx] = val;
      return { ...prev, steps };
    });
  }

  // -- 材料行 --
  function setIngredient(idx: number, key: keyof TrialIngredient, val: string | number) {
    setForm((prev) => {
      const ingredients = prev.ingredients.map((row, i) => i === idx ? { ...row, [key]: val } : row);
      return { ...prev, ingredients };
    });
  }
  function addIngredient() {
    setForm((prev) => ({ ...prev, ingredients: [...prev.ingredients, emptyIngredient()] }));
  }
  function removeIngredient(idx: number) {
    setForm((prev) => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== idx) }));
  }

  // -- 仕入行 --
  function setPurchase(idx: number, key: keyof TrialPurchase, val: string | number) {
    setForm((prev) => {
      const purchases = prev.purchases.map((row, i) => i === idx ? { ...row, [key]: val } : row);
      return { ...prev, purchases };
    });
  }
  function addPurchase() {
    setForm((prev) => ({ ...prev, purchases: [...prev.purchases, emptyPurchase()] }));
  }
  function removePurchase(idx: number) {
    setForm((prev) => ({ ...prev, purchases: prev.purchases.filter((_, i) => i !== idx) }));
  }

  // -- 保存 --
  function handleSave() {
    if (!form.name.trim()) { setError("商品名を入力してください"); return; }
    const payload = {
      ...form,
      desired_price: Number(form.desired_price) || 0,
      packaging_cost: Number(form.packaging_cost) || 0,
    };
    startTransition(async () => {
      const res = isNew
        ? await createTrial(payload)
        : await updateTrial(selected!.id, payload);
      if (res.error) { setError(res.error); return; }
      setError(null);
      router.refresh();
      closeForm();
    });
  }

  // -- 削除 --
  function handleDelete(id: string) {
    if (!confirm("この試作シートを削除しますか？")) return;
    startTransition(async () => {
      const res = await deleteTrial(id);
      if (res.error) { setError(res.error); return; }
      setTrials((prev) => prev.filter((t) => t.id !== id));
      if (selected?.id === id) closeForm();
      router.refresh();
    });
  }

  const filteredTrials = catFilter === "すべて" ? trials : trials.filter((t) => t.category === catFilter);

  // フォームが開いているか
  const formOpen = isNew || selected !== null;

  return (
    <div className="flex gap-4 h-full min-h-0">

      {/* ─── 左ペイン：一覧 ─── */}
      <div className={cn("flex flex-col shrink-0 transition-all", formOpen ? "w-56" : "w-72")}>
        {/* 新規ボタン */}
        <button
          onClick={openNew}
          className="flex items-center gap-2 w-full mb-3 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          新規試作を作成
        </button>

        {/* カテゴリフィルタ */}
        <div className="flex gap-1 mb-3 flex-wrap">
          {(["すべて", ...TRIAL_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                catFilter === c
                  ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* リスト */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredTrials.length === 0 && (
            <p className="text-xs text-neutral-400 px-2 pt-2">試作シートがありません</p>
          )}
          {filteredTrials.map((t) => {
            const col = CATEGORY_COLOR[t.category];
            const isActive = selected?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => openEdit(t)}
                className={cn(
                  "group flex items-start gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all",
                  isActive
                    ? cn(col.bg, col.border)
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                )}
              >
                <div className="flex-1 min-w-0">
                  <span className={cn("inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mb-1", col.badge)}>
                    {t.category}
                  </span>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {t.name || "（無題）"}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {new Date(t.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── メイン：フォーム ─── */}
      {formOpen ? (
        <div className="flex-1 min-w-0 overflow-y-auto space-y-4">

          {/* ヘッダー */}
          <div className={cn("flex items-center justify-between rounded-xl border px-4 py-3", colors.bg, colors.border)}>
            <div className="flex items-center gap-3 min-w-0">
              <span className={cn("text-xs font-semibold px-2 py-1 rounded-full shrink-0", colors.badge)}>
                {form.category}
              </span>
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="商品名を入力"
                className="flex-1 min-w-0 bg-transparent text-lg font-bold text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>
            <button onClick={closeForm} className="shrink-0 p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors ml-2">
              <X size={16} />
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* カテゴリ選択 */}
          <div className={cardCls}>
            <p className={sectionTitle}>カテゴリ</p>
            <div className="flex gap-2">
              {TRIAL_CATEGORIES.map((c) => {
                const col = CATEGORY_COLOR[c];
                return (
                  <button
                    key={c}
                    onClick={() => setField("category", c)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                      form.category === c
                        ? cn(col.bg, col.border, "font-semibold")
                        : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300"
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 基本情報 */}
          <div className={cardCls}>
            <p className={sectionTitle}>基本情報</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>コンセプト</label>
                <textarea rows={3} value={form.concept} onChange={(e) => setField("concept", e.target.value)} placeholder="例：さっぱり系の夏限定ドリンク" className={textareaCls} />
              </div>
              <div>
                <label className={labelCls}>ターゲット</label>
                <textarea rows={3} value={form.target} onChange={(e) => setField("target", e.target.value)} placeholder="例：20〜30代女性" className={textareaCls} />
              </div>
              <div>
                <label className={labelCls}>PRポイント</label>
                <textarea rows={3} value={form.pr_points} onChange={(e) => setField("pr_points", e.target.value)} placeholder="例：映えるビジュアルと爽快感" className={textareaCls} />
              </div>
            </div>
          </div>

          {/* 使用材料 */}
          <div className={cardCls}>
            <p className={sectionTitle}>使用材料</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-2 font-medium text-neutral-500 dark:text-neutral-400 text-xs w-[40%]">材料名</th>
                    <th className="text-left py-2 pr-2 font-medium text-neutral-500 dark:text-neutral-400 text-xs w-[25%]">使用量(g)</th>
                    <th className="text-left py-2 pr-2 font-medium text-neutral-500 dark:text-neutral-400 text-xs w-[25%]">材料原価(円)</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.ingredients.map((row, idx) => (
                    <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-1.5 pr-2">
                        <input value={row.name} onChange={(e) => setIngredient(idx, "name", e.target.value)} placeholder="材料名" className={cellInputCls} />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input type="number" value={row.amount_g || ""} onChange={(e) => setIngredient(idx, "amount_g", Number(e.target.value))} placeholder="0" className={cellInputCls} />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input type="number" value={row.cost || ""} onChange={(e) => setIngredient(idx, "cost", Number(e.target.value))} placeholder="0" className={cellInputCls} />
                      </td>
                      <td className="py-1.5">
                        <button onClick={() => removeIngredient(idx)} disabled={form.ingredients.length === 1} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500 disabled:opacity-30 transition-colors">
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="pt-2">
                      <button onClick={addIngredient} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        <Plus size={12} /> 行を追加
                      </button>
                    </td>
                  </tr>
                  <tr className="border-t border-neutral-200 dark:border-neutral-700">
                    <td colSpan={2} className="pt-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium">材料原価 合計</td>
                    <td className="pt-2 text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      ¥{form.ingredients.reduce((s, i) => s + (Number(i.cost) || 0), 0).toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 試作仕入材料 */}
          <div className={cardCls}>
            <p className={sectionTitle}>試作仕入材料</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-2 font-medium text-neutral-500 dark:text-neutral-400 text-xs w-[30%]">仕入材料</th>
                    <th className="text-left py-2 pr-2 font-medium text-neutral-500 dark:text-neutral-400 text-xs w-[18%]">金額(円)</th>
                    <th className="text-left py-2 pr-2 font-medium text-neutral-500 dark:text-neutral-400 text-xs w-[20%]">1g当たり原価</th>
                    <th className="text-left py-2 pr-2 font-medium text-neutral-500 dark:text-neutral-400 text-xs w-[25%]">仕入先</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.purchases.map((row, idx) => (
                    <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-1.5 pr-2">
                        <input value={row.material} onChange={(e) => setPurchase(idx, "material", e.target.value)} placeholder="材料名" className={cellInputCls} />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input type="number" value={row.amount || ""} onChange={(e) => setPurchase(idx, "amount", Number(e.target.value))} placeholder="0" className={cellInputCls} />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input type="number" value={row.cost_per_g || ""} onChange={(e) => setPurchase(idx, "cost_per_g", Number(e.target.value))} placeholder="0.0" step="0.01" className={cellInputCls} />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input value={row.supplier} onChange={(e) => setPurchase(idx, "supplier", e.target.value)} placeholder="仕入先" className={cellInputCls} />
                      </td>
                      <td className="py-1.5">
                        <button onClick={() => removePurchase(idx)} disabled={form.purchases.length === 1} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500 disabled:opacity-30 transition-colors">
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="pt-2">
                      <button onClick={addPurchase} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        <Plus size={12} /> 行を追加
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 作成手順 */}
          <div className={cardCls}>
            <p className={sectionTitle}>作成手順</p>
            <div className="mb-3">
              <label className={labelCls}>事前準備</label>
              <textarea rows={2} value={form.prep_notes} onChange={(e) => setField("prep_notes", e.target.value)} placeholder="仕込みや下準備など" className={textareaCls} />
            </div>
            <div className="space-y-2">
              {form.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs font-bold flex items-center justify-center shrink-0 mt-2">
                    {idx + 1}
                  </span>
                  <input
                    value={step}
                    onChange={(e) => setStep(idx, e.target.value)}
                    placeholder={`手順 ${idx + 1}`}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 原価計算サマリー */}
          <div className={cn(cardCls, colors.bg, colors.border)}>
            <p className={sectionTitle}>原価計算</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>希望販売価格(円)</label>
                <input type="number" value={form.desired_price} onChange={(e) => setField("desired_price", e.target.value)} placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>包装(円)</label>
                <input type="number" value={form.packaging_cost} onChange={(e) => setField("packaging_cost", e.target.value)} placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>原価(自動計算)</label>
                <div className="flex items-center h-[42px] px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  ¥{cost.toLocaleString()}
                </div>
              </div>
              <div>
                <label className={labelCls}>原価率(自動計算)</label>
                <div className={cn(
                  "flex items-center h-[42px] px-3 rounded-lg border text-sm font-bold",
                  costRate === "—"
                    ? "border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                    : Number(costRate.replace("%", "")) > 35
                      ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                      : "border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                )}>
                  {costRate}
                </div>
              </div>
            </div>
          </div>

          {/* 評価 */}
          <div className={cardCls}>
            <p className={sectionTitle}>試作評価</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>良い点</label>
                <textarea rows={4} value={form.good_points} onChange={(e) => setField("good_points", e.target.value)} placeholder="味、見た目、作りやすさなど" className={textareaCls} />
              </div>
              <div>
                <label className={labelCls}>気になった点・悪い点</label>
                <textarea rows={4} value={form.concerns} onChange={(e) => setField("concerns", e.target.value)} placeholder="課題点や改善が必要な部分" className={textareaCls} />
              </div>
              <div>
                <label className={labelCls}>改善点</label>
                <textarea rows={4} value={form.improvements} onChange={(e) => setField("improvements", e.target.value)} placeholder="次回試作に向けた改善案" className={textareaCls} />
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end pb-6">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              <Save size={15} />
              {isPending ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      ) : (
        /* フォーム未選択時 */
        <div className="flex-1 flex items-center justify-center text-neutral-400">
          <div className="text-center space-y-2">
            <ChevronRight size={32} className="mx-auto opacity-30" />
            <p className="text-sm">左の一覧から試作シートを選択するか、<br />「新規試作を作成」してください</p>
          </div>
        </div>
      )}
    </div>
  );
}
