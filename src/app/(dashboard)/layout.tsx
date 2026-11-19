import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DashboardLayoutClient } from "@admin/app/(dashboard)/DashboardLayoutClient";
import { SUB_SIDEBAR_SECTIONS, SUPER_SIDEBAR_SECTIONS } from "@admin/shared/constants/sidebar-config";
import {
  decodeJwtPayload,
  pickAdminRole,
  pickExpiresInSeconds,
} from "@admin/shared/lib/auth/admin-auth";

/** 대시보드 전 route가 동일한 레이아웃·렌더 모드(SSR)를 쓰도록 고정 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "홍풍 어드민 페이지",
  description: "홍풍 어드민 페이지",
};

export default async function DashBoardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? decodeJwtPayload(token) : null;
  const initialRemainSeconds = pickExpiresInSeconds(payload);
  const adminRole = pickAdminRole(payload);
  const config =
    adminRole === "SUPER" ? SUPER_SIDEBAR_SECTIONS : SUB_SIDEBAR_SECTIONS;

  return (
    <DashboardLayoutClient
      initialRemainSeconds={initialRemainSeconds}
      adminRole={adminRole}
      config={config}
    >
      {children}
    </DashboardLayoutClient>
  );
}
