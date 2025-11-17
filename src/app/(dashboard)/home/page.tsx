import { cookies } from "next/headers";
import { decodeJwtPayload, pickAdminRole } from "@admin/shared/lib/auth/admin-auth";
import { BlockedAccessAlert } from "./_components/BlockedAccessAlert";
import { HomeDashboardPage } from "./_components/HomeDashboardPage";
import { SubHomeDashboardPage } from "./_components/SubHomeDashboardPage";

export default function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? decodeJwtPayload(token) : null;
  const role = pickAdminRole(payload);
  const Dashboard = role === "SUPER" ? HomeDashboardPage : SubHomeDashboardPage;

  return (
    <>
      <BlockedAccessAlert />
      <Dashboard />
    </>
  );
}
