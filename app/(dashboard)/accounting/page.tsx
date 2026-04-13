import { createClient } from "@/utils/supabase/server";
import { requirePermission } from "@/utils/permissions";
import SalesClient from "./_components/SalesClient";
import type { Sale, ProductForSale } from "@/types/accounting";
import type { SettingsMap } from "../system/master/page";

function getMonthRange(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { start, end };
}

export default async function AccountingPage() {
  await requirePermission("view_accounting");
  let sales: Sale[] = [];
  let products: ProductForSale[] = [];
  let settings: SettingsMap = {};
  let dbError = false;

  try {
    const supabase = await createClient();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const { start: curStart, end: curEnd } = getMonthRange(year, month);

    const [{ data: curSales }, { data: productData }, { data: settingsData }] = await Promise.all([
      supabase
        .from("sales")
        .select("*, sale_items(*)")
        .gte("date", curStart)
        .lte("date", curEnd)
        .order("date", { ascending: false })
        .order("time_slot", { ascending: true }),
      supabase
        .from("products")
        .select("id, name, price, status, sale_start, sale_end")
        .neq("status", "終了")
        .order("name"),
      supabase.from("settings").select("key, value"),
    ]);

    sales = (curSales ?? []) as Sale[];
    products = (productData ?? []) as ProductForSale[];
    (settingsData ?? []).forEach((row) => { settings[row.key] = row.value; });
  } catch {
    dbError = true;
  }

  return (
    <SalesClient
      sales={sales}
      products={products}
      settings={settings}
      dbError={dbError}
    />
  );
}
