"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

function revalidateMarketing() {
  ["/marketing", "/marketing/ads", "/marketing/analytics", "/marketing/media"].forEach((p) =>
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
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMarketing();
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMarketing();
}

// ----------------------------------------------------------------
// Ads
// ----------------------------------------------------------------

export async function createAd(data: {
  title: string;
  channel: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  cost: number;
  status: string;
  campaign_id: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("ads").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/marketing/ads");
  revalidatePath("/marketing/analytics");
}

export async function updateAd(
  id: string,
  data: {
    title: string;
    channel: string;
    description: string;
    start_date: string | null;
    end_date: string | null;
    cost: number;
    status: string;
    campaign_id: string | null;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("ads").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/marketing/ads");
  revalidatePath("/marketing/analytics");
}

export async function deleteAd(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ads").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/marketing/ads");
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
  const supabase = await createClient();
  const { error } = await supabase.from("media_assets").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/marketing/media");
}

export async function updateMediaAsset(
  id: string,
  data: { name: string; tags: string[]; campaign_id: string | null }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("media_assets").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/marketing/media");
}

export async function deleteMediaAsset(id: string, filePath: string) {
  const supabase = await createClient();
  // Storage から削除
  await supabase.storage.from("marketing").remove([filePath]);
  // DB から削除
  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/marketing/media");
}
