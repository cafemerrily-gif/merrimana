"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { canDo } from "@/utils/permissions";

const ERR_PERM = { error: "権限がありません" } as const;

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
}): Promise<{ data?: Record<string, unknown>; error?: string }> {
  if (!await canDo("edit_marketing")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { data: row, error } = await supabase.from("campaigns").insert(data).select().single();
    if (error) return { error: error.message };
    revalidateMarketing();
    return { data: row };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "作成に失敗しました" };
  }
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
): Promise<{ data?: Record<string, unknown>; error?: string }> {
  if (!await canDo("edit_marketing")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { data: row, error } = await supabase.from("campaigns").update(data).eq("id", id).select().single();
    if (error) return { error: error.message };
    revalidateMarketing();
    return { data: row };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "更新に失敗しました" };
  }
}

export async function deleteCampaign(id: string): Promise<{ error?: string }> {
  if (!await canDo("edit_marketing")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidateMarketing();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "削除に失敗しました" };
  }
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
}): Promise<{ data?: Record<string, unknown>; error?: string }> {
  if (!await canDo("edit_marketing")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { data: row, error } = await supabase.from("pr_activities").insert(data).select().single();
    if (error) return { error: error.message };
    revalidatePath("/marketing/pr");
    revalidatePath("/marketing/analytics");
    return { data: row };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "作成に失敗しました" };
  }
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
): Promise<{ data?: Record<string, unknown>; error?: string }> {
  if (!await canDo("edit_marketing")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { data: row, error } = await supabase.from("pr_activities").update(data).eq("id", id).select().single();
    if (error) return { error: error.message };
    revalidatePath("/marketing/pr");
    revalidatePath("/marketing/analytics");
    return { data: row };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "更新に失敗しました" };
  }
}

export async function deletePrActivity(id: string): Promise<{ error?: string }> {
  if (!await canDo("edit_marketing")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("pr_activities").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/marketing/pr");
    revalidatePath("/marketing/analytics");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "削除に失敗しました" };
  }
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
}): Promise<{ error?: string }> {
  if (!await canDo("edit_marketing")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("media_assets").insert(data);
    if (error) return { error: error.message };
    revalidatePath("/marketing/media");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "作成に失敗しました" };
  }
}

export async function updateMediaAsset(
  id: string,
  data: { name: string; tags: string[]; campaign_id: string | null }
): Promise<{ error?: string }> {
  if (!await canDo("edit_marketing")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("media_assets").update(data).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/marketing/media");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "更新に失敗しました" };
  }
}

export async function deleteMediaAsset(id: string, filePath: string): Promise<{ error?: string }> {
  if (!await canDo("edit_marketing")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    await supabase.storage.from("marketing").remove([filePath]);
    const { error } = await supabase.from("media_assets").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/marketing/media");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "削除に失敗しました" };
  }
}
