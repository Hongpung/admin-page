import type { Metadata } from "next";
import { cookies } from "next/headers";
import DashboardShell from "@admin/shared/components/layout/DashboardShell";
import { SUB_SIDEBAR_SECTIONS, SUPER_SIDEBAR_SECTIONS } from "@admin/shared/constants/sidebar-config";
import {
  decodeJwtPayload,
  pickAdminRole,
  pickExpiresInSeconds,
} from "@admin/shared/lib/auth/admin-auth";

export const metadata: Metadata = {
  title: "홍풍 어드민 페이지",
  description: "홍풍 어드민 페이지",
};

export default async function DashBoardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? decodeJwtPayload(token) : null;
  const initialRemainSeconds = pickExpiresInSeconds(payload);
  const adminRole = pickAdminRole(payload);
  const config =
    adminRole === "SUPER" ? SUPER_SIDEBAR_SECTIONS : SUB_SIDEBAR_SECTIONS;

  return (
    <DashboardShell
      initialRemainSeconds={initialRemainSeconds}
      adminRole={adminRole}
      config={config}
    >
      {children}
    </DashboardShell>
  );
}
