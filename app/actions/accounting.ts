"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
  amount: number;
  customer_count: number;
  notes: string;
  items: SaleItemInput[];
}) {
  const supabase = await createClient();
  const { data: sale, error } = await supabase
    .from("sales")
    .insert({
      date: data.date,
      amount: data.amount,
      customer_count: data.customer_count,
      notes: data.notes,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (data.items.length > 0) {
    const { error: itemError } = await supabase
      .from("sale_items")
      .insert(data.items.map((i) => ({ ...i, sale_id: sale.id })));
    if (itemError) throw new Error(itemError.message);
  }

  revalidateAll();
}

export async function updateSale(
  id: string,
  data: {
    date: string;
    amount: number;
    customer_count: number;
    notes: string;
    items: SaleItemInput[];
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sales")
    .update({
      date: data.date,
      amount: data.amount,
      customer_count: data.customer_count,
      notes: data.notes,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // 明細を全件洗い替え
  await supabase.from("sale_items").delete().eq("sale_id", id);
  if (data.items.length > 0) {
    const { error: itemError } = await supabase
      .from("sale_items")
      .insert(data.items.map((i) => ({ ...i, sale_id: id })));
    if (itemError) throw new Error(itemError.message);
  }

  revalidateAll();
}

export async function deleteSale(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sales").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAll();
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
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert(data);
  if (error) throw new Error(error.message);
  revalidateAll();
}

export async function updateExpense(
  id: string,
  data: { date: string; category: string; description: string; vendor: string; amount: number }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAll();
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAll();
}

// ----------------------------------------------------------------
// Budgets
// ----------------------------------------------------------------

export async function upsertBudget(data: {
  year: number;
  month: number;
  category: string;
  amount: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .upsert(data, { onConflict: "year,month,category" });
  if (error) throw new Error(error.message);
  revalidatePath("/accounting/budget");
}
