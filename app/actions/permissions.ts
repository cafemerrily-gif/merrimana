"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

/** 権限マトリクス全体を上書き保存する */
export async function savePermissions(matrix: Record<string, string[]>): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error: delError } = await supabase
      .from("unit_permissions")
      .delete()
      .neq("unit", "___never___");
    if (delError) return { error: delError.message };

    const rows = Object.entries(matrix).flatMap(([unit, perms]) =>
      perms.map((permission_id) => ({ unit, permission_id }))
    );

    if (rows.length > 0) {
      const { error } = await supabase.from("unit_permissions").insert(rows);
      if (error) return { error: error.message };
    }

    revalidatePath("/system/roles");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "保存に失敗しました" };
  }
}
