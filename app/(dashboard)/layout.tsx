import { getMyPermissions } from "@/utils/permissions";
import DashboardLayoutClient from "./_components/DashboardLayoutClient";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const permissions = await getMyPermissions();
  return (
    <DashboardLayoutClient permissions={permissions}>
      {children}
    </DashboardLayoutClient>
  );
}
