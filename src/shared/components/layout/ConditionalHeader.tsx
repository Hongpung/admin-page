"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import { isDashboardPath } from "@admin/app/dashboard-path";

export function ConditionalHeader() {
  const pathname = usePathname() ?? "";
  if (isDashboardPath(pathname) || pathname.startsWith("/login")) return null;
  return <Header />;
}
