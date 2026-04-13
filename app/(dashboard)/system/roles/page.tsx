import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdminRole } from "@/utils/permissions";
import RolesClient from "./_components/RolesClient";

export default async function RolesPage() {
  await requireAdminRole();

  let matrix: Record<string, string[]> = {};
  let dbError = false;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("unit_permissions")
      .select("unit, permission_id");

    if (error) throw error;

    (data ?? []).forEach(({ unit, permission_id }) => {
      if (!matrix[unit]) matrix[unit] = [];
      matrix[unit].push(permission_id);
    });
  } catch {
    dbError = true;
  }

  return <RolesClient initial={matrix} dbError={dbError} />;
}
