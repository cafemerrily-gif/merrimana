"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { canDo } from "@/utils/permissions";
import type { TrialIngredient, TrialPurchase, TrialCategory } from "@/types/product-trial";

const ERR_PERM = { error: "権限がありません" } as const;
const REVALIDATE = () => revalidatePath("/products/trials");

type TrialInput = {
  name: string;
  category: TrialCategory;
  concept: string;
  target: string;
  pr_points: string;
  desired_price: number;
  packaging_cost: number;
  prep_notes: string;
  steps: string[];
  good_points: string;
  concerns: string;
  improvements: string;
  ingredients: TrialIngredient[];
  purchases: TrialPurchase[];
};

export async function createTrial(data: TrialInput): Promise<{ id?: string; error?: string }> {
  if (!await canDo("edit_products")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { ingredients, purchases, ...rest } = data;

    const { data: trial, error } = await supabase
      .from("product_trials")
      .insert({ ...rest, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) return { error: error.message };

    if (ingredients.length > 0) {
      const { error: e } = await supabase
        .from("product_trial_ingredients")
        .insert(ingredients.map((i, idx) => ({ ...i, id: undefined, trial_id: trial.id, sort_order: idx })));
      if (e) return { error: e.message };
    }

    if (purchases.length > 0) {
      const { error: e } = await supabase
        .from("product_trial_purchases")
        .insert(purchases.map((p, idx) => ({ ...p, id: undefined, trial_id: trial.id, sort_order: idx })));
      if (e) return { error: e.message };
    }

    REVALIDATE();
    return { id: trial.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "作成に失敗しました" };
  }
}

export async function updateTrial(id: string, data: TrialInput): Promise<{ error?: string }> {
  if (!await canDo("edit_products")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { ingredients, purchases, ...rest } = data;

    const { error } = await supabase
      .from("product_trials")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: error.message };

    await supabase.from("product_trial_ingredients").delete().eq("trial_id", id);
    await supabase.from("product_trial_purchases").delete().eq("trial_id", id);

    if (ingredients.length > 0) {
      const { error: e } = await supabase
        .from("product_trial_ingredients")
        .insert(ingredients.map((i, idx) => ({ ...i, id: undefined, trial_id: id, sort_order: idx })));
      if (e) return { error: e.message };
    }

    if (purchases.length > 0) {
      const { error: e } = await supabase
        .from("product_trial_purchases")
        .insert(purchases.map((p, idx) => ({ ...p, id: undefined, trial_id: id, sort_order: idx })));
      if (e) return { error: e.message };
    }

    REVALIDATE();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "更新に失敗しました" };
  }
}

export async function deleteTrial(id: string): Promise<{ error?: string }> {
  if (!await canDo("edit_products")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("product_trials").delete().eq("id", id);
    if (error) return { error: error.message };
    REVALIDATE();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "削除に失敗しました" };
  }
}
