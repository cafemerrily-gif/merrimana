"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { canDo } from "@/utils/permissions";

const ERR_PERM = { error: "権限がありません" } as const;

const REVALIDATE_PATHS = ["/accounting", "/accounting/expenses", "/accounting/pl", "/accounting/budget"];

function revalidateAll() {
  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
}

// ----------------------------------------------------------------
// Sales
// ----------------------------------------------------------------

type SaleItemInput = {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

export async function createSale(data: {
  date: string;
  time_slot: string | null;
  weather: string | null;
  amount: number;
  customer_count: number;
  notes: string;
  items: SaleItemInput[];
}): Promise<{ error?: string }> {
  if (!await canDo("edit_accounting")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { data: sale, error } = await supabase
      .from("sales")
      .insert({ date: data.date, time_slot: data.time_slot, weather: data.weather, amount: data.amount, customer_count: data.customer_count, notes: data.notes })
      .select()
      .single();
    if (error) return { error: error.message };

    if (data.items.length > 0) {
      const { error: itemError } = await supabase
        .from("sale_items")
        .insert(data.items.map((i) => ({ ...i, sale_id: sale.id })));
      if (itemError) return { error: itemError.message };
    }

    revalidateAll();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "作成に失敗しました" };
  }
}

export async function updateSale(
  id: string,
  data: {
    date: string;
    time_slot: string | null;
    weather: string | null;
    amount: number;
    customer_count: number;
    notes: string;
    items: SaleItemInput[];
  }
): Promise<{ error?: string }> {
  if (!await canDo("edit_accounting")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("sales")
      .update({ date: data.date, time_slot: data.time_slot, weather: data.weather, amount: data.amount, customer_count: data.customer_count, notes: data.notes })
      .eq("id", id);
    if (error) return { error: error.message };

    await supabase.from("sale_items").delete().eq("sale_id", id);
    if (data.items.length > 0) {
      const { error: itemError } = await supabase
        .from("sale_items")
        .insert(data.items.map((i) => ({ ...i, sale_id: id })));
      if (itemError) return { error: itemError.message };
    }

    revalidateAll();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "更新に失敗しました" };
  }
}

export async function deleteSale(id: string): Promise<{ error?: string }> {
  if (!await canDo("edit_accounting")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidateAll();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "削除に失敗しました" };
  }
}

// ----------------------------------------------------------------
// Expenses
// ----------------------------------------------------------------

export async function createExpense(data: {
  date: string;
  category: string;
  description: string;
  vendor: string;
  amount: number;
}): Promise<{ error?: string }> {
  if (!await canDo("edit_accounting")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("expenses").insert(data);
    if (error) return { error: error.message };
    revalidateAll();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "作成に失敗しました" };
  }
}

export async function updateExpense(
  id: string,
  data: { date: string; category: string; description: string; vendor: string; amount: number }
): Promise<{ error?: string }> {
  if (!await canDo("edit_accounting")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("expenses").update(data).eq("id", id);
    if (error) return { error: error.message };
    revalidateAll();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "更新に失敗しました" };
  }
}

export async function deleteExpense(id: string): Promise<{ error?: string }> {
  if (!await canDo("edit_accounting")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidateAll();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "削除に失敗しました" };
  }
}

// ----------------------------------------------------------------
// Budgets
// ----------------------------------------------------------------

export async function upsertBudget(data: {
  year: number;
  month: number;
  category: string;
  amount: number;
}): Promise<{ error?: string }> {
  if (!await canDo("edit_accounting")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("budgets")
      .upsert(data, { onConflict: "year,month,category" });
    if (error) return { error: error.message };
    revalidatePath("/accounting/budget");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "保存に失敗しました" };
  }
}
