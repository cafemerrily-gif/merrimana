import { createClient } from "@/utils/supabase/server";
import { requirePermission } from "@/utils/permissions";
import MasterClient from "./_components/MasterClient";

export type SettingsMap = Record<string, string>;

export default async function MasterPage() {
  await requirePermission("manage_master");
  let settings: SettingsMap = {};
  let dbError = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase.from("settings").select("key, value");
    (data ?? []).forEach((row) => { settings[row.key] = row.value; });
  } catch {
    dbError = true;
  }

  return <MasterClient settings={settings} dbError={dbError} />;
}
