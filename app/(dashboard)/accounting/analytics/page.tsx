import { createClient } from "@/utils/supabase/server";
import { requirePermission } from "@/utils/permissions";
import AnalyticsClient from "./_components/AnalyticsClient";

function getMonthRange(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { start, end };
}

export type SaleForAnalytics = {
  id: string;
  date: string;
  time_slot: string | null;
  weather: string | null;
  amount: number;
  customer_count: number;
  sale_items: {
    product_id: string;
    product_name: string;
    quantity: number;
    subtotal: number;
  }[];
};

export type ProductCategory = { id: string; category_name: string };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requirePermission("view_accounting");
  const { month: monthParam } = await searchParams;
  const now = new Date();
  const [paramYear, paramMonth] = monthParam
    ? monthParam.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];
  const year = paramYear || now.getFullYear();
  const month = paramMonth || now.getMonth() + 1;
  const { start, end } = getMonthRange(year, month);

  // Build list of available months (last 12)
  const availableMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  let sales: SaleForAnalytics[] = [];
  let productCategories: ProductCategory[] = [];
  let dbError = false;

  try {
    const supabase = await createClient();
    const [{ data: salesData }, { data: productsData }] = await Promise.all([
      supabase
        .from("sales")
        .select("id, date, time_slot, weather, amount, customer_count, sale_items(product_id, product_name, quantity, subtotal)")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true }),
      supabase
        .from("products")
        .select("id, category:categories(name)"),
    ]);

    sales = (salesData ?? []) as SaleForAnalytics[];
    productCategories = (productsData ?? []).map((p: { id: string; category: { name: string }[] | { name: string } | null }) => ({
      id: p.id,
      category_name: (Array.isArray(p.category) ? p.category[0]?.name : (p.category as { name: string } | null)?.name) ?? "未設定",
    }));
  } catch {
    dbError = true;
  }

  return (
    <AnalyticsClient
      sales={sales}
      productCategories={productCategories}
      currentMonth={`${year}-${String(month).padStart(2, "0")}`}
      availableMonths={availableMonths}
      dbError={dbError}
    />
  );
}
