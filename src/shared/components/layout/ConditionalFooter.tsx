"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";
import { isDashboardPath } from "@admin/app/dashboard-path";

export function ConditionalFooter() {
  const pathname = usePathname() ?? "";
  if (isDashboardPath(pathname) || pathname.startsWith("/login")) return null;
  return <Footer />;
}
