import { createClient } from "@/utils/supabase/server";
import CampaignsClient from "./_components/CampaignsClient";
import type { Campaign } from "@/types/marketing";

export default async function MarketingPage() {
  let campaigns: Campaign[] = [];
  let dbError = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    campaigns = (data ?? []) as Campaign[];
  } catch {
    dbError = true;
  }

  return <CampaignsClient campaigns={campaigns} dbError={dbError} />;
}
