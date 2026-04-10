import { createClient } from "@/utils/supabase/server";
import SalesClient from "./_components/SalesClient";
import type { Sale, ProductForSale } from "@/types/accounting";

function getMonthRange(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { start, end };
}

export default async function AccountingPage() {
  let sales: Sale[] = [];
  let products: ProductForSale[] = [];
  let dbError = false;

  try {
    const supabase = await createClient();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const { start: curStart, end: curEnd } = getMonthRange(year, month);

    const [{ data: curSales }, { data: productData }] = await Promise.all([
      supabase
        .from("sales")
        .select("*, sale_items(*)")
        .gte("date", curStart)
        .lte("date", curEnd)
        .order("date", { ascending: false }),
      supabase
        .from("products")
        .select("id, name, price, status, sale_start, sale_end")
        .neq("status", "終了")
        .order("name"),
    ]);

    sales = (curSales ?? []) as Sale[];
    products = (productData ?? []) as ProductForSale[];
  } catch {
    dbError = true;
  }

  return (
    <SalesClient
      sales={sales}
      products={products}
      dbError={dbError}
    />
  );
}
