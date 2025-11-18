import { queryOptions } from "@tanstack/react-query";
import {
  loadSessionLogsByDate,
  loadSessionMonthCalendar,
  loadSessionSpecific,
} from "../api";
import type { Session } from "../types";

export const sessionQueryKeys = {
  all: ["session"] as const,
  monthCalendar: (year: number, month: number) =>
    [...sessionQueryKeys.all, "monthCalendar", year, month] as const,
  dailyLogs: (dateKey: string) =>
    [...sessionQueryKeys.all, "dailyLogs", dateKey] as const,
  detail: (sessionId: number) =>
    [...sessionQueryKeys.all, "detail", sessionId] as const,
};

export function sessionMonthCalendarQueryOptions(year: number, month: number) {
  return queryOptions<Record<string, number>>({
    queryKey: sessionQueryKeys.monthCalendar(year, month),
    queryFn: async () => loadSessionMonthCalendar(year, month),
  });
}

export function sessionDailyLogsQueryOptions(dateKey: string) {
  return queryOptions<Session[]>({
    queryKey: sessionQueryKeys.dailyLogs(dateKey),
    queryFn: async () => loadSessionLogsByDate(dateKey),
  });
}

export function sessionDetailQueryOptions(sessionId: number) {
  return queryOptions<Session>({
    queryKey: sessionQueryKeys.detail(sessionId),
    queryFn: async () => loadSessionSpecific(sessionId),
    enabled: Number.isFinite(sessionId) && sessionId > 0,
  });
}
