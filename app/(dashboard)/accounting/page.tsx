import { createClient } from "@/utils/supabase/server";
import SalesClient from "./_components/SalesClient";
import type { Sale, MonthlySale } from "@/types/accounting";

function getMonthRange(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { start, end };
}

function buildMonthlySummary(
  records: { date: string; amount: number; customer_count: number }[],
  months: { year: number; month: number; label: string }[]
): MonthlySale[] {
  return months.map(({ year, month, label }) => {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const filtered = records.filter((r) => r.date.startsWith(key));
    return {
      month: key,
      label,
      amount: filtered.reduce((s, r) => s + r.amount, 0),
      customerCount: filtered.reduce((s, r) => s + r.customer_count, 0),
    };
  });
}

export default async function AccountingPage() {
  let sales: Sale[] = [];
  let monthlySummary: MonthlySale[] = [];
  let dbError = false;

  try {
    const supabase = await createClient();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // 直近6ヶ月のリスト
    const sixMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - 1 - (5 - i), 1);
      return {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: `${d.getMonth() + 1}月`,
      };
    });

    const oldest = sixMonths[0];
    const { start: chartStart } = getMonthRange(oldest.year, oldest.month);
    const { start: curStart, end: curEnd } = getMonthRange(year, month);

    const [{ data: allSales }, { data: curSales }] = await Promise.all([
      supabase
        .from("sales")
        .select("date, amount, customer_count")
        .gte("date", chartStart)
        .order("date", { ascending: false }),
      supabase
        .from("sales")
        .select("*")
        .gte("date", curStart)
        .lte("date", curEnd)
        .order("date", { ascending: false }),
    ]);

    monthlySummary = buildMonthlySummary(allSales ?? [], sixMonths);
    sales = (curSales ?? []) as Sale[];
  } catch {
    dbError = true;
  }

  return <SalesClient sales={sales} monthlySummary={monthlySummary} dbError={dbError} />;
}
