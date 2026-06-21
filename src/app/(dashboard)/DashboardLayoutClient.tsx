"use client";

import type { ReactNode } from "react";
import DashboardShell from "@admin/shared/components/layout/DashboardShell";
import type { AdminRole } from "@admin/shared/lib/auth/admin-auth";
import type { SidebarSection } from "@admin/shared/constants/sidebar-config";

type DashboardLayoutClientProps = {
  children: ReactNode;
  initialRemainSeconds: number;
  adminRole: AdminRole | null;
  config: SidebarSection[];
};

export function DashboardLayoutClient({
  children,
  initialRemainSeconds,
  adminRole,
  config,
}: DashboardLayoutClientProps) {
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
