import { requestJson } from "@admin/shared/lib/http/api-fetch";
import { mapSessionMonthCalendar, normalizeSession } from "../service";
import type { Session, SessionCalendarDay } from "../types";

export async function loadSessionMonthCalendar(
  year: number,
  month: number
): Promise<Record<string, number>> {
  const rows = await requestJson<SessionCalendarDay[]>(
    `/api/session/month-calendar?year=${year}&month=${month}`,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return mapSessionMonthCalendar(rows);
}

export async function loadSessionLogsByDate(
  dateKey: string
): Promise<Session[]> {
  const data = await requestJson<Record<string, unknown>[]>(
    `/api/session/daily?date=${encodeURIComponent(dateKey)}`,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return data.map((row) => normalizeSession(row));
}

export async function loadLatestSessionLogs(skip = 0): Promise<Session[]> {
  const data = await requestJson<Record<string, unknown>[]>(
    `/api/session/load?skip=${encodeURIComponent(String(skip))}`,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return data.map((row) => normalizeSession(row));
}

export async function loadSessionSpecific(sessionId: number): Promise<Session> {
  const row = await requestJson<Record<string, unknown>>(
    `/api/session/specific/${sessionId}`,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return normalizeSession(row);
}
