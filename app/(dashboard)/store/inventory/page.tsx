import { createClient } from "@/utils/supabase/server";
import InventoryClient from "./_components/InventoryClient";

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  min_quantity: number;
  max_quantity: number;
  current_quantity: number;
  updated_at: string | null;
};

export default async function InventoryPage() {
  let items: InventoryItem[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("inventory_items")
      .select("id, name, category, unit, min_quantity, max_quantity, current_quantity, updated_at")
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    items = (data ?? []) as InventoryItem[];
  } catch {
    // DB unavailable
  }

  return <InventoryClient items={items} />;
}
