import { createClient } from "@/utils/supabase/server";
import { requirePermission } from "@/utils/permissions";
import BudgetClient from "./_components/BudgetClient";
import { EXPENSE_CATEGORIES } from "@/types/accounting";

export type BudgetRow = {
  category: string;
  type: "revenue" | "cost" | "profit";
  budget: number;
  actual: number;
};

export default async function BudgetPage() {
  await requirePermission("view_accounting");
  let budgetRows: BudgetRow[] = [];
  let dbError = false;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  try {
    const supabase = await createClient();
    const pad = (n: number) => String(n).padStart(2, "0");
    const start = `${year}-${pad(month)}-01`;
    const end = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;

    const [{ data: budgets }, { data: sales }, { data: expenses }] = await Promise.all([
      supabase.from("budgets").select("*").eq("year", year).eq("month", month),
      supabase.from("sales").select("amount").gte("date", start).lte("date", end),
      supabase.from("expenses").select("category, amount").gte("date", start).lte("date", end),
    ]);

    const getBudget = (cat: string) =>
      (budgets ?? []).find((b) => b.category === cat)?.amount ?? 0;

    const totalSales = (sales ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);
    const totalExpenses = (expenses ?? []).reduce((s: number, e: { amount: number }) => s + e.amount, 0);
    const budgetProfit =
      getBudget("売上高") -
      EXPENSE_CATEGORIES.reduce((s, cat) => s + getBudget(cat), 0);

    const expenseMap = new Map<string, number>();
    (expenses ?? []).forEach((e: { category: string; amount: number }) => {
      expenseMap.set(e.category, (expenseMap.get(e.category) ?? 0) + e.amount);
    });

    budgetRows = [
      { category: "売上高", type: "revenue", budget: getBudget("売上高"), actual: totalSales },
      ...EXPENSE_CATEGORIES.map((cat) => ({
        category: cat,
        type: "cost" as const,
        budget: getBudget(cat),
        actual: expenseMap.get(cat) ?? 0,
      })),
      {
        category: "営業利益",
        type: "profit",
        budget: budgetProfit > 0 ? budgetProfit : 0,
        actual: totalSales - totalExpenses,
      },
    ];
  } catch {
    dbError = true;
  }

  return (
    <BudgetClient
      budgetRows={budgetRows}
      year={year}
      month={month}
      dbError={dbError}
    />
  );
}
