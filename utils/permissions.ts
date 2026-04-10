import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
export { PERMISSION_DEFS, type PermissionId } from "@/utils/permission-defs";

/**
 * ログイン中ユーザーの権限リストを返す。
 * - unit_permissions テーブルが未作成、またはそのユニットの設定がない場合は null を返す（全許可）。
 * - 未ログインは空配列を返す。
 */
export async function getMyPermissions(): Promise<string[] | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("unit")
      .eq("id", user.id)
      .single();

    if (!profile?.unit) return null; // プロフィール未設定 → 全許可（フォールバック）

    const { data: perms, error } = await supabase
      .from("unit_permissions")
      .select("permission_id")
      .eq("unit", profile.unit);

    if (error || !perms || perms.length === 0) return null; // テーブル未作成またはデータなし → 全許可

    return perms.map((p) => p.permission_id);
  } catch {
    return null; // エラー時は全許可（安全側フォールバック）
  }
}

/**
 * 指定権限がなければ /unauthorized へリダイレクト。
 * getMyPermissions が null（全許可状態）の場合はスルー。
 */
export async function requirePermission(permissionId: string): Promise<void> {
  const perms = await getMyPermissions();
  if (perms !== null && !perms.includes(permissionId)) {
    redirect("/unauthorized");
  }
}
