import { createClient } from "@/utils/supabase/server";
import { requirePermission } from "@/utils/permissions";
import PrActivityClient from "./_components/PrActivityClient";
import type { PrActivity } from "@/types/marketing";

export default async function PrActivityPage() {
  await requirePermission("view_marketing");
  let activities: PrActivity[] = [];
  let campaigns: { id: string; title: string }[] = [];
  let dbError = false;

  try {
    const supabase = await createClient();
    const [{ data: actData }, { data: campData }] = await Promise.all([
      supabase
        .from("pr_activities")
        .select("*, campaign:campaigns(id, title)")
        .order("scheduled_at", { ascending: true, nullsFirst: false }),
      supabase
        .from("campaigns")
        .select("id, title")
        .in("status", ["準備中", "実施中"])
        .order("created_at", { ascending: false }),
    ]);
    activities = (actData ?? []) as PrActivity[];
    campaigns = campData ?? [];
  } catch {
    dbError = true;
  }

  // DB内で使用済みのチャネル名を収集（カスタムチャネル対応）
  const usedChannels = Array.from(new Set(activities.map((a) => a.channel)));

  return <PrActivityClient activities={activities} campaigns={campaigns} usedChannels={usedChannels} dbError={dbError} />;
}
