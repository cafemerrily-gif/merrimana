import { createClient } from "@/utils/supabase/server";
import AdsClient from "./_components/AdsClient";
import type { Ad, Campaign } from "@/types/marketing";

export default async function AdsPage() {
  let ads: Ad[] = [];
  let campaigns: Pick<Campaign, "id" | "title">[] = [];
  let dbError = false;

  try {
    const supabase = await createClient();
    const [{ data: adsData }, { data: campaignsData }] = await Promise.all([
      supabase
        .from("ads")
        .select("*, campaign:campaigns(id, title)")
        .order("created_at", { ascending: false }),
      supabase
        .from("campaigns")
        .select("id, title")
        .neq("status", "終了")
        .order("title"),
    ]);
    ads = (adsData ?? []) as Ad[];
    campaigns = campaignsData ?? [];
  } catch {
    dbError = true;
  }

  return <AdsClient ads={ads} campaigns={campaigns} dbError={dbError} />;
}
