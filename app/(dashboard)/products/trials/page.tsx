import { createClient } from "@/utils/supabase/server";
import { requirePermission } from "@/utils/permissions";
import TrialsClient from "./_components/TrialsClient";

export default async function TrialsPage() {
  await requirePermission("view_products");
  try {
    const supabase = await createClient();
    const { data: trials } = await supabase
      .from("product_trials")
      .select("*, product_trial_ingredients(*), product_trial_purchases(*)")
      .order("created_at", { ascending: false });
    return <TrialsClient initialTrials={trials ?? []} />;
  } catch {
    return <TrialsClient initialTrials={[]} />;
  }
}
