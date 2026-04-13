import { createClient } from "@/utils/supabase/server";
import { requirePermission } from "@/utils/permissions";
import ProductsClient from "./_components/ProductsClient";

export default async function ProductsPage() {
  await requirePermission("view_products");
  try {
    const supabase = await createClient();
    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase
        .from("products")
        .select("*, category:categories(*)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);
    return (
      <ProductsClient
        initialProducts={products ?? []}
        categories={categories ?? []}
      />
    );
  } catch {
    return <ProductsClient initialProducts={[]} categories={[]} />;
  }
}
