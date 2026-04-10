import { createAdminClient } from "@/utils/supabase/admin";
import { requirePermission } from "@/utils/permissions";
import UsersClient from "./_components/UsersClient";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  unit: string;
  role: string;
  lastSignIn: string | null;
  createdAt: string;
  confirmed: boolean;
};

export default async function SystemPage() {
  await requirePermission("manage_users");
  let users: UserRow[] = [];
  let dbError = false;

  try {
    const supabase = createAdminClient();
    const [{ data: authData }, { data: profiles }] = await Promise.all([
      supabase.auth.admin.listUsers(),
      supabase.from("profiles").select("id, name, unit, role"),
    ]);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p])
    );

    users = (authData?.users ?? []).map((u) => {
      const profile = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        name: profile?.name ?? u.user_metadata?.name ?? "",
        unit: profile?.unit ?? "店舗スタッフ",
        role: profile?.role ?? "スタッフ",
        lastSignIn: u.last_sign_in_at ?? null,
        createdAt: u.created_at,
        confirmed: !!u.email_confirmed_at,
      };
    });
  } catch {
    dbError = true;
  }

  return <UsersClient users={users} dbError={dbError} />;
}
