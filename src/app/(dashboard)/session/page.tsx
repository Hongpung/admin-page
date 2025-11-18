"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  dateFromDateKey,
  SessionDetailPanel,
  SessionListPanel,
  SessionLogCalendar,
  sessionDailyLogsQueryOptions,
  sessionDetailQueryOptions,
  toDateKeyLocal,
  useSessionPageUrlAction,
  type Session,
} from "@admin/features/session";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function SessionPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { deleteSessionIdWithReplace, pushSessionId } = useSessionPageUrlAction(
    {
      pathname,
      router,
      searchParams,
    },
  );
  const sessionIdParam = searchParams.get("sessionId");
  const parsedSessionId =
    sessionIdParam != null && Number.isFinite(Number(sessionIdParam))
      ? Number(sessionIdParam)
      : null;

  const pendingUrlHydrateRef = useRef(!!sessionIdParam);
  const prevDateKeyRef = useRef<string | null>(null);
  const skipClearOnNextDateChangeRef = useRef(false);
  const selectedSessionIdRef = useRef<number | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday);
  const [selectedSession, setSession] = useState<Session | null>(null);

  selectedSessionIdRef.current = selectedSession?.sessionId ?? null;
  const selectedDateKey = toDateKeyLocal(selectedDate);

  const dailyLogsQuery = useQuery(sessionDailyLogsQueryOptions(selectedDateKey));
  const selectedSessionDetailQuery = useQuery({
    ...sessionDetailQueryOptions(selectedSession?.sessionId ?? 0),
    enabled: selectedSession != null,
  });
  const urlSessionDetailQuery = useQuery({
    ...sessionDetailQueryOptions(parsedSessionId ?? 0),
    enabled: parsedSessionId != null,
  });

  useEffect(() => {
    const key = toDateKeyLocal(selectedDate);
    if (prevDateKeyRef.current === null) {
      prevDateKeyRef.current = key;
      return;
    }
    if (prevDateKeyRef.current === key) return;
    prevDateKeyRef.current = key;
    if (skipClearOnNextDateChangeRef.current) {
      skipClearOnNextDateChangeRef.current = false;
      return;
    }
    setSession(null);
  }, [selectedDate]);

  useEffect(() => {
    if (!sessionIdParam) {
      pendingUrlHydrateRef.current = false;
      return;
    }
    if (parsedSessionId == null) {
      pendingUrlHydrateRef.current = false;
      deleteSessionIdWithReplace();
      return;
    }
    if (selectedSessionIdRef.current === parsedSessionId) {
      pendingUrlHydrateRef.current = false;
      return;
    }
    if (urlSessionDetailQuery.isLoading || urlSessionDetailQuery.isFetching) {
      return;
    }
    if (urlSessionDetailQuery.isError || !urlSessionDetailQuery.data) {
      pendingUrlHydrateRef.current = false;
      deleteSessionIdWithReplace();
      return;
    }

    const d = dateFromDateKey(urlSessionDetailQuery.data.date);
    if (!d) {
      pendingUrlHydrateRef.current = false;
      deleteSessionIdWithReplace();
      return;
    }

    skipClearOnNextDateChangeRef.current = true;
    setSelectedDate(d);
    setSession(urlSessionDetailQuery.data);
    pendingUrlHydrateRef.current = false;
  }, [
    deleteSessionIdWithReplace,
    parsedSessionId,
    searchParams,
    sessionIdParam,
    urlSessionDetailQuery.isFetching,
    urlSessionDetailQuery.isLoading,
    urlSessionDetailQuery.data,
    urlSessionDetailQuery.isError,
  ]);

  const handleSelectSession = useCallback(
    (session: Session | null) => {
      setSession(session);
      if (!session) return;
      pushSessionId(session.sessionId);
    },
    [pushSessionId],
  );

  useEffect(() => {
    const current = searchParams.get("sessionId");
    const next = selectedSession ? String(selectedSession.sessionId) : null;
    if (next == null && current != null && pendingUrlHydrateRef.current) {
      return;
    }
    if (current === next) return;
    if (next != null) return;
    deleteSessionIdWithReplace();
  }, [deleteSessionIdWithReplace, selectedSession, searchParams]);

  const listDateY = selectedDate.getFullYear();
  const listDateM = selectedDate.getMonth() + 1;
  const listDateD = selectedDate.getDate();

  return (
    <div className="flex flex-row gap-8 h-full">
      <div
        className="flex flex-col border top-0 sticky rounded-md py-3 overflow-hidden gap-6 h-fit"
        style={{ minWidth: 360, minHeight: 600, maxHeight: 840 }}
      >
        <div className="font-semibold px-4 ">연습실 이용 내역</div>
        <SessionLogCalendar
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            const next = new Date(d);
            next.setHours(0, 0, 0, 0);
            setSelectedDate(next);
          }}
        />
        <div className="text-sm text-gray-500 px-4">
          {listDateY}년 {listDateM}월 {listDateD}일
        </div>
        <SessionListPanel
          sessions={dailyLogsQuery.data ?? []}
          loading={dailyLogsQuery.isLoading || dailyLogsQuery.isFetching}
          selectedSessionId={selectedSession?.sessionId ?? null}
          onSelect={handleSelectSession}
        />
      </div>
      <div className="flex-1 h-dvh border rounded-md py-3 gap-6 min-w-[50vw]">
        {selectedSession ? (
          <SessionDetailPanel
            session={selectedSessionDetailQuery.data ?? selectedSession}
          />
        ) : (
          <div className="flex h-full w-full justify-center items-center">
            <div className="font-semibold text-xl text-gray-300">
              왼쪽에서 내역을 선택해주세요
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
