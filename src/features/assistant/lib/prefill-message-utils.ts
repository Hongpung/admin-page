import {
  addDays,
  getKstDateParts,
  toYmd,
} from "@admin/features/assistant/lib/assistant-date-range";
import {
  TimeArray,
  type TimeFormat,
} from "@admin/features/reservation/constants/constants";

export const TITLE_STOP_WORDS = new Set([
  "내일",
  "모레",
  "오늘",
  "정기연습",
  "정기",
  "예약",
  "생성",
  "등록",
]);

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isEmptyField(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

export function isEmptyInputFieldValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return !Number.isFinite(value);
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function mergeMissingFields(
  current: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...current };

  for (const [key, value] of Object.entries(patch)) {
    if (isEmptyField(next[key])) {
      next[key] = value;
    }
  }

  return next;
}

export function resolveRelativeDate(message: string): string | null {
  const normalized = message.replace(/\s+/g, "");
  const today = getKstDateParts();

  if (normalized.includes("모레")) {
    return toYmd(addDays(today, 2));
  }
  if (normalized.includes("내일")) {
    return toYmd(addDays(today, 1));
  }

  const isoMatch = message.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return null;
}

export function parseKoreanClock(
  message: string,
): { hour: number; minute: number } | null {
  const hhmm = message.match(/\b(\d{1,2}):(\d{2})\b/);
  if (hhmm) {
    return { hour: Number(hhmm[1]), minute: Number(hhmm[2]) };
  }

  const korean = message.match(
    /(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/,
  );
  if (!korean) return null;

  let hour = Number(korean[2]);
  const minute = korean[3] ? Number(korean[3]) : 0;
  const ampm = korean[1];

  if (ampm === "오후" && hour < 12) hour += 12;
  if (ampm === "오전" && hour === 12) hour = 0;
  if (!ampm && hour >= 1 && hour <= 6) hour += 12;

  return { hour, minute };
}

export function snapToTimeFormat(hour: number, minute: number): TimeFormat | null {
  const normalizedMinute = minute >= 30 ? 30 : 0;
  const candidate = `${String(hour).padStart(2, "0")}:${normalizedMinute === 30 ? "30" : "00"}`;

  if ((TimeArray as readonly string[]).includes(candidate)) {
    return candidate as TimeFormat;
  }

  for (const slot of TimeArray) {
    if (slot >= candidate) {
      return slot;
    }
  }

  return null;
}

export function parseDurationMinutes(message: string): number | null {
  if (/(?:한\s*시간|1\s*시간)/.test(message)) return 60;
  if (/(?:두\s*시간|2\s*시간)/.test(message)) return 120;
  if (/(?:세\s*시간|3\s*시간)/.test(message)) return 180;

  const hourMatch = message.match(/(\d+)\s*시간/);
  if (hourMatch) {
    return Number(hourMatch[1]) * 60;
  }

  const minuteMatch = message.match(/(\d+)\s*분/);
  if (minuteMatch && !/시\s*간/.test(message)) {
    return Number(minuteMatch[1]);
  }

  return null;
}

export function addDurationToTime(
  start: TimeFormat,
  minutes: number,
): TimeFormat | null {
  const startIdx = TimeArray.indexOf(start);
  const slots = Math.max(1, Math.round(minutes / 30));
  const endIdx = startIdx + slots;
  if (endIdx >= TimeArray.length) return null;
  return TimeArray[endIdx] ?? null;
}

export function parseEndClock(message: string): TimeFormat | null {
  const endMatch = message.match(
    /까지\s*(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/,
  );
  if (!endMatch) return null;

  let hour = Number(endMatch[2]);
  const minute = endMatch[3] ? Number(endMatch[3]) : 0;
  const ampm = endMatch[1];
  if (ampm === "오후" && hour < 12) hour += 12;
  if (ampm === "오전" && hour === 12) hour = 0;
  if (!ampm && hour >= 1 && hour <= 6) hour += 12;

  return snapToTimeFormat(hour, minute);
}

export function extractTitle(message: string): string | null {
  const quoted = message.match(/["'「『]([^"'」』]{1,40})["'」』]/);
  if (quoted?.[1]?.trim()) {
    return quoted[1].trim();
  }

  const practiceTitle = message.match(/(정기연습|합주|연습)\s*(?:을|를)/);
  if (practiceTitle?.[1]) {
    return practiceTitle[1];
  }

  const hostTitle = message.match(
    /(?:\d+시간짜리\s+)?([가-힣a-zA-Z][가-힣a-zA-Z0-9]{0,20})\s*(?:을|를)\s+[가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,11}\s*(?:을|를)\s*주최자/,
  );
  const hostCandidate = hostTitle?.[1]?.trim();
  if (hostCandidate && !TITLE_STOP_WORDS.has(hostCandidate.replace(/\s+/g, ""))) {
    return hostCandidate;
  }

  if (message.includes("정기연습")) return "정기연습";
  if (message.includes("연습")) return "연습";
  return null;
}

export function parseReservationTypeFromMessage(
  message: string,
): "REGULAR" | "COMMON" | null {
  const normalized = message.replace(/\s+/g, "");
  if (/정기(?:연습)?/.test(normalized)) {
    return "REGULAR";
  }
  if (/연습|생성|등록|예약/.test(normalized)) {
    return "REGULAR";
  }
  return null;
}
