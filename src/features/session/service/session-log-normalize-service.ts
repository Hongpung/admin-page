import type {
  Session,
  SessionAttendanceEntry,
  SessionAttendanceStatusLabel,
  SessionCalendarDay,
} from "../types";

const KNOWN_ATTENDANCE = new Set<SessionAttendanceStatusLabel>([
  "출석",
  "지각",
  "결석",
  "참가",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNullableString(value: unknown): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

function normalizeAttendanceStatus(value: unknown): SessionAttendanceStatusLabel {
  const status = String(value ?? "");
  if (KNOWN_ATTENDANCE.has(status as SessionAttendanceStatusLabel)) {
    return status as SessionAttendanceStatusLabel;
  }
  return "참가";
}

export function normalizeAttendanceList(
  raw: unknown,
): SessionAttendanceEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const normalized: SessionAttendanceEntry[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    if (!isRecord(item.member)) continue;

    normalized.push({
      status: normalizeAttendanceStatus(item.status),
      timeStamp: toNullableString(item.timeStamp),
      member: {
        memberId: item.member.memberId as number | string,
        name: String(item.member.name ?? ""),
        nickname: toNullableString(item.member.nickname),
      },
    });
  }

  return normalized;
}

export function normalizeReturnImageUrl(value: unknown): string[] | null {
  if (value == null) return null;
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return null;

  return value.filter((item): item is string => typeof item === "string");
}

export function normalizeSession(raw: Record<string, unknown>): Session {
  const borrowInstruments = Array.isArray(raw.borrowInstruments)
    ? raw.borrowInstruments
        .filter(isRecord)
        .map((instrument) => ({
          imageUrl: toNullableString(instrument.imageUrl) ?? undefined,
          name: String(instrument.name ?? ""),
          instrumentType: String(instrument.instrumentType ?? ""),
          club: toNullableString(instrument.club) ?? undefined,
        }))
    : [];

  return {
    sessionId: Number(raw.sessionId),
    date: String(raw.date ?? ""),
    title: String(raw.title ?? ""),
    reservationType: toNullableString(raw.reservationType),
    sessionType: String(raw.sessionType ?? ""),
    participationAvailable: Boolean(raw.participationAvailable),
    creatorName: String(raw.creatorName ?? ""),
    creatorNickname: toNullableString(raw.creatorNickname),
    startTime: String(raw.startTime ?? ""),
    endTime: String(raw.endTime ?? ""),
    forceEnd: Boolean(raw.forceEnd),
    extendCount: Number(raw.extendCount ?? 0),
    borrowInstruments,
    returnImageUrl: normalizeReturnImageUrl(raw.returnImageUrl),
    attendanceList: normalizeAttendanceList(raw.attendanceList),
  };
}

export function mapSessionMonthCalendar(
  rows: SessionCalendarDay[],
): Record<string, number> {
  const mapped: Record<string, number> = {};
  for (const row of rows) {
    mapped[row.date] = row.sessionCount;
  }
  return mapped;
}
