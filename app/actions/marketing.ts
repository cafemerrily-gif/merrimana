"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

function revalidateMarketing() {
  ["/marketing", "/marketing/pr", "/marketing/analytics", "/marketing/media"].forEach((p) =>
    revalidatePath(p)
  );
}

// ----------------------------------------------------------------
// Campaigns
// ----------------------------------------------------------------

export async function createCampaign(data: {
  title: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  tags: string[];
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("campaigns").insert(data);
  if (error) throw new Error(error.message);
  revalidateMarketing();
}

export async function updateCampaign(
  id: string,
  data: {
    title: string;
    description: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
    tags: string[];
  }
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("campaigns").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMarketing();
}

export async function deleteCampaign(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMarketing();
}

// ----------------------------------------------------------------
// PR Activities
// ----------------------------------------------------------------

export async function createPrActivity(data: {
  title: string;
  channel: string;
  description: string;
  scheduled_at: string | null;
  status: string;
  campaign_id: string | null;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("pr_activities").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/marketing/pr");
  revalidatePath("/marketing/analytics");
}

export async function updatePrActivity(
  id: string,
  data: {
    title: string;
    channel: string;
    description: string;
    scheduled_at: string | null;
    status: string;
    campaign_id: string | null;
  }
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("pr_activities").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/marketing/pr");
  revalidatePath("/marketing/analytics");
}

export async function deletePrActivity(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("pr_activities").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/marketing/pr");
  revalidatePath("/marketing/analytics");
}

// ----------------------------------------------------------------
// Media Assets
// ----------------------------------------------------------------

export async function insertMediaAsset(data: {
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  tags: string[];
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("media_assets").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/marketing/media");
}

export async function updateMediaAsset(
  id: string,
  data: { name: string; tags: string[]; campaign_id: string | null }
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("media_assets").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/marketing/media");
}

export async function deleteMediaAsset(id: string, filePath: string) {
  const supabase = createAdminClient();
  await supabase.storage.from("marketing").remove([filePath]);
  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/marketing/media");
}
