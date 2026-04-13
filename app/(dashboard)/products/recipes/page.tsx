import { createClient } from "@/utils/supabase/server";
import { requirePermission } from "@/utils/permissions";
import RecipesClient from "./_components/RecipesClient";

export default async function RecipesPage() {
  await requirePermission("view_products");
  try {
    const supabase = await createClient();
    const [{ data: recipes }, { data: products }] = await Promise.all([
      supabase
        .from("recipes")
        .select("*, product:products(*, category:categories(*)), ingredients:recipe_ingredients(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("products")
        .select("id, name")
        .eq("status", "販売中")
        .order("name"),
    ]);
    return (
      <RecipesClient
        initialRecipes={recipes ?? []}
        products={products ?? []}
      />
    );
  } catch {
    return <RecipesClient initialRecipes={[]} products={[]} />;
  }
}
