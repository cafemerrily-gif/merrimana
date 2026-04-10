"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

/** 権限マトリクス全体を上書き保存する */
export async function savePermissions(matrix: Record<string, string[]>) {
  const supabase = createAdminClient();

  // 全行削除してから再挿入（シンプルに全置換）
  const { error: delError } = await supabase
    .from("unit_permissions")
    .delete()
    .neq("unit", "___never___"); // 全行対象
  if (delError) throw new Error(delError.message);

  const rows = Object.entries(matrix).flatMap(([unit, perms]) =>
    perms.map((permission_id) => ({ unit, permission_id }))
  );

  if (rows.length > 0) {
    const { error } = await supabase.from("unit_permissions").insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/system/roles");
}
