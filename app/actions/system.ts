"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { canDo } from "@/utils/permissions";

const ERR_PERM = { error: "権限がありません" } as const;

const REVALIDATE = () => {
  revalidatePath("/system");
  revalidatePath("/system/master");
};

// ----------------------------------------------------------------
// ユーザー招待
// ----------------------------------------------------------------

export async function inviteUser(data: {
  email: string;
  name: string;
  units: string[];
  role: string;
}): Promise<{ error?: string }> {
  if (!await canDo("manage_users")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const { data: result, error } = await supabase.auth.admin.inviteUserByEmail(
      data.email,
      siteUrl ? { redirectTo: `${siteUrl}/auth/confirm` } : {}
    );
    if (error) return { error: error.message };

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: result.user.id,
      name: data.name,
      units: data.units,
      role: data.role,
    });
    if (profileError) return { error: profileError.message };

    REVALIDATE();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "招待に失敗しました" };
  }
}

// ----------------------------------------------------------------
// プロフィール更新
// ----------------------------------------------------------------

export async function updateProfile(
  userId: string,
  data: { name: string; units: string[]; role: string }
): Promise<{ error?: string }> {
  if (!await canDo("manage_users")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("profiles").upsert({ id: userId, ...data });
    if (error) return { error: error.message };
    REVALIDATE();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "更新に失敗しました" };
  }
}

// ----------------------------------------------------------------
// ユーザー削除
// ----------------------------------------------------------------

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  if (!await canDo("manage_users")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };
    REVALIDATE();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "削除に失敗しました" };
  }
}

// ----------------------------------------------------------------
// マスタ設定保存
// ----------------------------------------------------------------

export async function saveSettings(entries: { key: string; value: string }[]): Promise<{ error?: string }> {
  if (!await canDo("manage_master")) return ERR_PERM;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("settings").upsert(
      entries.map((e) => ({ ...e, updated_at: new Date().toISOString() })),
      { onConflict: "key" }
    );
    if (error) return { error: error.message };
    revalidatePath("/system/master");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "保存に失敗しました" };
  }
}
