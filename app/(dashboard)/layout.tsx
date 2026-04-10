import { getMyPermissions } from "@/utils/permissions";
import { createClient } from "@/utils/supabase/server";
import DashboardLayoutClient from "./_components/DashboardLayoutClient";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [permissions, supabase] = await Promise.all([
    getMyPermissions(),
    createClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("name").eq("id", user.id).single()
    : { data: null };

  const currentUser = user
    ? { name: profile?.name || "", email: user.email ?? "" }
    : null;

  return (
    <DashboardLayoutClient permissions={permissions} currentUser={currentUser}>
      {children}
    </DashboardLayoutClient>
  );
}
