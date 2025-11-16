"use client";

import { usePathname } from "next/navigation";
import { isDashboardPath } from "@admin/app/dashboard-path";

export function ConditionalMain({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname() ?? "";
  const dashboard = isDashboardPath(pathname);
  const login = pathname.startsWith("/login");
  return (
    <main
      className={
        dashboard
          ? "flex-grow flex flex-row w-full h-[100dvh] m-0 p-0 overflow-hidden"
          : login
            ? "flex h-[100dvh] w-full m-0 p-0 overflow-hidden"
            : "flex-grow flex flex-row gap-8 ml-16 mr-32 my-4"
      }
    >
      {children}
    </main>
  );
}
