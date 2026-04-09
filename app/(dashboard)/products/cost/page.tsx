import { createClient } from "@/utils/supabase/server";
import CostClient from "./_components/CostClient";

export type CostRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  costPerUnit: number | null;
  margin: number | null;
};

export default async function CostPage() {
  let rows: CostRow[] = [];
  let dbError = false;

  try {
    const supabase = await createClient();
    const [{ data: products }, { data: recipes }] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, price, category:categories(name)")
        .order("name"),
      supabase
        .from("recipes")
        .select("product_id, yield_count, ingredients:recipe_ingredients(cost)"),
    ]);

    const recipeMap = new Map<string, { yield_count: number; total_cost: number }>();
    (recipes ?? []).forEach((r) => {
      const total = (r.ingredients as { cost: number }[]).reduce((s, i) => s + i.cost, 0);
      recipeMap.set(r.product_id, { yield_count: r.yield_count, total_cost: total });
    });

    rows = (products ?? []).map((p) => {
      const recipe = recipeMap.get(p.id);
      const costPerUnit = recipe
        ? Math.round(recipe.total_cost / recipe.yield_count)
        : null;
      const margin =
        costPerUnit !== null ? ((p.price - costPerUnit) / p.price) * 100 : null;
      return {
        id: p.id,
        name: p.name,
        category: (p.category as unknown as { name: string } | null)?.name ?? "—",
        price: p.price,
        costPerUnit,
        margin,
      };
    });
  } catch {
    dbError = true;
  }

  return <CostClient rows={rows} dbError={dbError} />;
}
