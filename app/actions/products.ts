"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// ----------------------------------------------------------------
// Products
// ----------------------------------------------------------------

export async function createProduct(data: {
  name: string;
  category_id: string | null;
  price: number;
  status: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/products");
  revalidatePath("/products/cost");
}

export async function updateProduct(
  id: string,
  data: { name: string; category_id: string | null; price: number; status: string }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/products");
  revalidatePath("/products/cost");
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/products");
  revalidatePath("/products/cost");
  revalidatePath("/products/recipes");
}

// ----------------------------------------------------------------
// Categories
// ----------------------------------------------------------------

export async function createCategory(data: {
  name: string;
  description: string;
  color: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/products/categories");
  revalidatePath("/products");
}

export async function updateCategory(
  id: string,
  data: { name: string; description: string; color: string }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/products/categories");
  revalidatePath("/products");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/products/categories");
  revalidatePath("/products");
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
}) {
  const supabase = await createClient();
  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      product_id: data.product_id,
      yield_count: data.yield_count,
      time_minutes: data.time_minutes,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (data.ingredients.length > 0) {
    const { error: ingError } = await supabase
      .from("recipe_ingredients")
      .insert(data.ingredients.map((i) => ({ ...i, recipe_id: recipe.id })));
    if (ingError) throw new Error(ingError.message);
  }

  revalidatePath("/products/recipes");
  revalidatePath("/products/cost");
}

export async function updateRecipe(
  id: string,
  data: {
    product_id: string;
    yield_count: number;
    time_minutes: number;
    ingredients: IngredientInput[];
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("recipes")
    .update({ product_id: data.product_id, yield_count: data.yield_count, time_minutes: data.time_minutes })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // 材料を全件洗い替え
  await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
  if (data.ingredients.length > 0) {
    const { error: ingError } = await supabase
      .from("recipe_ingredients")
      .insert(data.ingredients.map((i) => ({ ...i, recipe_id: id })));
    if (ingError) throw new Error(ingError.message);
  }

  revalidatePath("/products/recipes");
  revalidatePath("/products/cost");
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/products/recipes");
  revalidatePath("/products/cost");
}
