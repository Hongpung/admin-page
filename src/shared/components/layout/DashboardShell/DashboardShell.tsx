"use client";

import Image from "next/image";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LogoImage from "@public/small_logo.png";
import type { AdminRole } from "@admin/shared/lib/auth/admin-auth";
import { SidebarPanel } from "./SidebarPanel";
import { DashboardHeaderActions } from "./DashboardHeaderActions";
import type { SidebarSection } from "../../../constants/sidebar-config";

export default function DashboardShell({
  initialRemainSeconds,
  adminRole,
  config,
  children,
}: Readonly<{ initialRemainSeconds: number; adminRole: AdminRole | null; config: SidebarSection[]; children: React.ReactNode }>) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  /** 너비 애니메이션 끝난 뒤에만 푸터 표시 — 펼치는 중 좁은 폭에서 레이아웃이 흔들리지 않게 */
  const [sidebarFooterVisible, setSidebarFooterVisible] = useState(true);
  const sidebarOpenRef = useRef(sidebarOpen);

  useEffect(() => {
    sidebarOpenRef.current = sidebarOpen;
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) setSidebarFooterVisible(false);
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const id = window.setTimeout(() => {
      if (sidebarOpenRef.current) setSidebarFooterVisible(true);
    }, 1050);
    return () => window.clearTimeout(id);
  }, [sidebarOpen]);

  const adminTitle = adminRole === "SUB" ? "동아리 관리자" : "홍풍 관리자";

  const onAsideTransitionEnd = (e: React.TransitionEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== "width") return;
    setSidebarFooterVisible(sidebarOpenRef.current);
  };

  return (
    <div className="flex h-full min-h-[100dvh] w-full flex-col z-40">
      <div className="flex min-h-0 flex-1">
        <aside
          id="dashboard-sidebar"
          className={`flex h-full min-h-0 flex-col justify-between overflow-hidden border-r border-gray-300 bg-white shadow-md transition-[width] duration-200 ease-linear ${sidebarOpen ? "w-64" : "w-16"
            }`}
          onTransitionEnd={onAsideTransitionEnd}
        >
          <div
            className={`flex h-14 min-w-0 flex-row items-center overflow-hidden border-b border-gray-200 px-2 ${sidebarOpen ? "justify-between gap-2" : "justify-center gap-0"}`}
          >
            <div
              className={`flex min-w-0 cursor-pointer items-center overflow-hidden transition-opacity duration-200 ${sidebarOpen
                ? "max-w-full flex-1 gap-2 opacity-100"
                : "max-w-0 flex-none gap-0 opacity-0 pointer-events-none"
                }`}
              onClick={() => router.push("/home")}
            >
              <Image
                src={LogoImage}
                alt="Hongpung logo"
                width={28}
                height={28}
                className="shrink-0"
              />
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900">
                {adminTitle}
              </div>
            </div>
            <button
              type="button"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-gray-800 hover:bg-gray-200"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-expanded={sidebarOpen}
              aria-controls="dashboard-sidebar"
              title={sidebarOpen ? "사이드바 축소" : "사이드바 펼치기"}
            >
              {sidebarOpen ? (
                <ChevronsLeft className="size-5" aria-hidden />
              ) : (
                <ChevronsRight className="size-5" aria-hidden />
              )}
            </button>
          </div>

          <SidebarPanel
            collapsed={!sidebarOpen}
            footerVisible={sidebarFooterVisible}
            config={config}
          />
        </aside>

        <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-300 bg-gray-200 px-4">
            <div />
            <DashboardHeaderActions initialRemainSeconds={initialRemainSeconds} />
          </header>
          <div
            id="main-contents"
            className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto"
          >
            <div className="flex-1 min-h-full p-4"> {children} </div>
          </div>
        </div>
      </div>
    </div>
  );
}
