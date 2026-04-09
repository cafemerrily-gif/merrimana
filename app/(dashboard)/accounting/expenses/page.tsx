import { createClient } from "@/utils/supabase/server";
import ExpensesClient from "./_components/ExpensesClient";
import type { Expense } from "@/types/accounting";
import { EXPENSE_CATEGORIES } from "@/types/accounting";

export type CategoryTotal = {
  category: string;
  amount: number;
};

export default async function ExpensesPage() {
  let expenses: Expense[] = [];
  let categoryTotals: CategoryTotal[] = [];
  let dbError = false;

  try {
    const supabase = await createClient();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const pad = (n: number) => String(n).padStart(2, "0");
    const start = `${year}-${pad(month)}-01`;
    const end = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;

    const { data } = await supabase
      .from("expenses")
      .select("*")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });

    expenses = (data ?? []) as Expense[];

    // カテゴリ別合計
    const totalsMap = new Map<string, number>();
    expenses.forEach((e) => {
      totalsMap.set(e.category, (totalsMap.get(e.category) ?? 0) + e.amount);
    });

    categoryTotals = EXPENSE_CATEGORIES.map((cat) => ({
      category: cat,
      amount: totalsMap.get(cat) ?? 0,
    })).filter((c) => c.amount > 0);

    // 登録済みカテゴリで未定義のものを追加
    expenses.forEach((e) => {
      if (!EXPENSE_CATEGORIES.includes(e.category as (typeof EXPENSE_CATEGORIES)[number])) {
        const existing = categoryTotals.find((c) => c.category === e.category);
        if (!existing) {
          categoryTotals.push({ category: e.category, amount: totalsMap.get(e.category) ?? 0 });
        }
      }
    });
  } catch {
    dbError = true;
  }

  return <ExpensesClient expenses={expenses} categoryTotals={categoryTotals} dbError={dbError} />;
}
