"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

const REVALIDATE_PRODUCTS = () => {
  revalidatePath("/products");
  revalidatePath("/products/cost");
  revalidatePath("/accounting");
};

// ----------------------------------------------------------------
// Products
// ----------------------------------------------------------------

export async function createProduct(data: {
  name: string;
  category_id: string | null;
  price: number;
  status: string;
  sale_start: string | null;
  sale_end: string | null;
}): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("products").insert(data);
    if (error) return { error: error.message };
    REVALIDATE_PRODUCTS();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "作成に失敗しました" };
  }
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    category_id: string | null;
    price: number;
    status: string;
    sale_start: string | null;
    sale_end: string | null;
  }
): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("products").update(data).eq("id", id);
    if (error) return { error: error.message };
    REVALIDATE_PRODUCTS();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "更新に失敗しました" };
  }
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();

    // sale_items の参照チェック
    const { count } = await supabase
      .from("sale_items")
      .select("id", { count: "exact", head: true })
      .eq("product_id", id);
    if (count && count > 0) {
      return { error: "この商品には売上データが紐付いているため削除できません。ステータスを「終了」に変更してください。" };
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/products");
    revalidatePath("/products/cost");
    revalidatePath("/products/recipes");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "削除に失敗しました" };
  }
}

// ----------------------------------------------------------------
// Categories
// ----------------------------------------------------------------

export async function createCategory(data: {
  name: string;
  description: string;
  color: string;
}): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("categories").insert(data);
    if (error) return { error: error.message };
    revalidatePath("/products/categories");
    revalidatePath("/products");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "作成に失敗しました" };
  }
}

export async function updateCategory(
  id: string,
  data: { name: string; description: string; color: string }
): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("categories").update(data).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/products/categories");
    revalidatePath("/products");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "更新に失敗しました" };
  }
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/products/categories");
    revalidatePath("/products");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "削除に失敗しました" };
  }
}

// ----------------------------------------------------------------
// Recipes
// ----------------------------------------------------------------

type IngredientInput = { name: string; amount: string; cost: number };

export async function createRecipe(data: {
  product_id: string;
  yield_count: number;
  time_minutes: number;
  ingredients: IngredientInput[];
}): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { data: recipe, error } = await supabase
      .from("recipes")
      .insert({
        product_id: data.product_id,
        yield_count: data.yield_count,
        time_minutes: data.time_minutes,
      })
      .select()
      .single();
    if (error) return { error: error.message };

    if (data.ingredients.length > 0) {
      const { error: ingError } = await supabase
        .from("recipe_ingredients")
        .insert(data.ingredients.map((i) => ({ ...i, recipe_id: recipe.id })));
      if (ingError) return { error: ingError.message };
    }

    revalidatePath("/products/recipes");
    revalidatePath("/products/cost");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "作成に失敗しました" };
  }
}

export async function updateRecipe(
  id: string,
  data: {
    product_id: string;
    yield_count: number;
    time_minutes: number;
    ingredients: IngredientInput[];
  }
): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("recipes")
      .update({ product_id: data.product_id, yield_count: data.yield_count, time_minutes: data.time_minutes })
      .eq("id", id);
    if (error) return { error: error.message };

    await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
    if (data.ingredients.length > 0) {
      const { error: ingError } = await supabase
        .from("recipe_ingredients")
        .insert(data.ingredients.map((i) => ({ ...i, recipe_id: id })));
      if (ingError) return { error: ingError.message };
    }

    revalidatePath("/products/recipes");
    revalidatePath("/products/cost");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "更新に失敗しました" };
  }
}

export async function deleteRecipe(id: string): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/products/recipes");
    revalidatePath("/products/cost");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "削除に失敗しました" };
  }
}
