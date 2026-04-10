"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

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
}) {
  const supabase = createAdminClient();
  const { data: result, error } = await supabase.auth.admin.inviteUserByEmail(data.email);
  if (error) throw new Error(error.message);

  // プロフィール行を即時作成
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: result.user.id,
    name: data.name,
    units: data.units,
    role: data.role,
  });
  if (profileError) throw new Error(profileError.message);

  REVALIDATE();
}

// ----------------------------------------------------------------
// プロフィール更新
// ----------------------------------------------------------------

export async function updateProfile(
  userId: string,
  data: { name: string; units: string[]; role: string }
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...data });
  if (error) throw new Error(error.message);
  REVALIDATE();
}

// ----------------------------------------------------------------
// ユーザー削除
// ----------------------------------------------------------------

export async function deleteUser(userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  REVALIDATE();
}

// ----------------------------------------------------------------
// マスタ設定保存
// ----------------------------------------------------------------

export async function saveSettings(entries: { key: string; value: string }[]) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("settings").upsert(
    entries.map((e) => ({ ...e, updated_at: new Date().toISOString() })),
    { onConflict: "key" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/system/master");
}
