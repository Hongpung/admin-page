"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { extendAdminSession } from "@admin/shared/api/session-api";

const SESSION_DURATION_SECONDS = 60 * 60;

type DashboardHeaderActionsProps = {
  initialRemainSeconds: number;
};

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&")}=([^;]*)`,
    ),
  );
  return m?.[1] ? decodeURIComponent(m[1]) : "";
}

function formatRemainTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function DashboardHeaderActions({
  initialRemainSeconds,
}: DashboardHeaderActionsProps) {
  const pathname = usePathname();
  const [userLabel, setUserLabel] = useState("");
  const [remainSeconds, setRemainSeconds] = useState(
    Math.max(0, Math.floor(initialRemainSeconds)),
  );

  const extendSessionMutation = useMutation({
    mutationFn: extendAdminSession,
  });

  useEffect(() => {
    setUserLabel(readCookie("admin_user"));
  }, [pathname]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemainSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleExtendLogin = async () => {
    if (extendSessionMutation.isPending) return;

    try {
      const body = await extendSessionMutation.mutateAsync();
      setRemainSeconds(
        typeof body.expiresInSeconds === "number"
          ? Math.max(0, Math.floor(body.expiresInSeconds))
          : SESSION_DURATION_SECONDS,
      );

      if (body.message) alert(body.message);
    } catch (e) {
      alert(e instanceof Error ? e.message : "세션 연장에 실패했습니다.");
    }
  };

  const handleLogout = () => {
    const ok = window.confirm("정말 로그아웃하시겠습니까?");
    if (!ok) return;
    window.location.replace("/logout");
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700">
        {userLabel ? (
          <>
            <span className="text-gray-500">로그인 계정: </span>
            <span className="font-medium text-gray-900">{userLabel}</span>
          </>
        ) : (
          <span className="text-gray-500">관리자</span>
        )}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-600">
          남은 시간 {formatRemainTime(remainSeconds)}
        </span>
        <button
          type="button"
          className="rounded-md border border-blue-500 bg-blue-100 px-3 py-1.5 text-sm text-blue-900 hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleExtendLogin}
          disabled={extendSessionMutation.isPending}
        >
          {extendSessionMutation.isPending ? "연장 중..." : "로그인 연장"}
        </button>
      </div>
      <button
        type="button"
        className="rounded-md border border-gray-500 bg-gray-300 px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-400"
        onClick={handleLogout}
      >
        로그아웃
      </button>
    </div>
  );
}
