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
      .select("units, role")
      .eq("id", user.id)
      .single();

    if (!profile) return null; // プロフィール未設定 → 全許可（フォールバック）

    // 管理者ロールはユニットに関係なく全権限を持つ
    if (profile.role === "管理者") return null;

    const units: string[] = Array.isArray(profile.units) ? profile.units : [profile.units];
    if (units.length === 0) return null;

    const { data: perms, error } = await supabase
      .from("unit_permissions")
      .select("permission_id")
      .in("unit", units);

    if (error || !perms || perms.length === 0) return null; // テーブル未作成またはデータなし → 全許可

    // 重複を除いて返す
    return [...new Set(perms.map((p) => p.permission_id))];
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

/**
 * ロールが「管理者」でなければ /unauthorized へリダイレクト。
 */
export async function requireAdminRole(): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { redirect("/unauthorized"); return; }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "管理者") redirect("/unauthorized");
  } catch {
    redirect("/unauthorized");
  }
}

/**
 * Server Action 用: 権限があれば true、なければ false を返す（redirect しない）。
 */
export async function canDo(permissionId: string): Promise<boolean> {
  const perms = await getMyPermissions();
  return perms === null || perms.includes(permissionId);
}
