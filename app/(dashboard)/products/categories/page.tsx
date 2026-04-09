import { createClient } from "@/utils/supabase/server";
import CategoriesClient from "./_components/CategoriesClient";

export default async function CategoriesPage() {
  try {
    const supabase = await createClient();
    const { data: categories } = await supabase
      .from("categories")
      .select("*, products(id)")
      .order("created_at");

    // Attach product count
    const enriched = (categories ?? []).map((c) => ({
      ...c,
      product_count: (c.products as { id: string }[] | null)?.length ?? 0,
    }));

    return <CategoriesClient initialCategories={enriched} />;
  } catch {
    return <CategoriesClient initialCategories={[]} />;
  }
}
