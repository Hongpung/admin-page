import { getMonday, getSunday } from "@admin/features/reservation/lib/week-date-utils";

export type YmdDateParts = {
  year: number;
  month: number;
  day: number;
};

export function getKstDateParts(base = new Date()): YmdDateParts {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(base);

  const [year, month, day] = formatted.split("-").map(Number);
  return { year, month, day };
}

export function toYmd(parts: YmdDateParts): string {
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

export function addDays(parts: YmdDateParts, offset: number): YmdDateParts {
  const date = new Date(parts.year, parts.month - 1, parts.day);
  date.setDate(date.getDate() + offset);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function getKstTodayYmd(): string {
  return toYmd(getKstDateParts());
}

export function resolveRelativeDateFromMessage(message: string): string | null {
  const normalized = message.replace(/\s+/g, "");
  const today = getKstDateParts();

  if (normalized.includes("모레")) {
    return toYmd(addDays(today, 2));
  }
  if (normalized.includes("내일")) {
    return toYmd(addDays(today, 1));
  }
  if (normalized.includes("오늘")) {
    return toYmd(today);
  }

  const isoMatch = message.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return null;
}

function resolveRelativeKeyword(keyword: string): YmdDateParts | null {
  const today = getKstDateParts();
  if (keyword === "오늘") return today;
  if (keyword === "내일") return addDays(today, 1);
  if (keyword === "모레") return addDays(today, 2);
  return null;
}

function toYmdFromKoreanMonthDay(month: number, day: number): string {
  const year = getKstDateParts().year;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseBannerDateRangeFromMessage(message: string): {
  startDate?: string;
  endDate?: string;
} {
  const isoRange = message.match(
    /(\d{4}-\d{2}-\d{2})\s*(?:부터|~|에서)\s*(\d{4}-\d{2}-\d{2})\s*(?:까지)?/,
  );
  if (isoRange) {
    return { startDate: isoRange[1], endDate: isoRange[2] };
  }

  const koreanRange = message.match(
    /(\d{1,2})\s*월\s*(\d{1,2})\s*일\s*(?:부터|~|에서)\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일\s*(?:까지)?/,
  );
  if (koreanRange) {
    return {
      startDate: toYmdFromKoreanMonthDay(
        Number(koreanRange[1]),
        Number(koreanRange[2]),
      ),
      endDate: toYmdFromKoreanMonthDay(
        Number(koreanRange[3]),
        Number(koreanRange[4]),
      ),
    };
  }

  const startRelative = message.match(/(오늘|내일|모레)\s*부터/);
  const endRelative = message.match(/(?:부터\s*)?(오늘|내일|모레)\s*까지/);
  const range: { startDate?: string; endDate?: string } = {};

  if (startRelative?.[1]) {
    const parts = resolveRelativeKeyword(startRelative[1]);
    if (parts) range.startDate = toYmd(parts);
  }
  if (endRelative?.[1]) {
    const parts = resolveRelativeKeyword(endRelative[1]);
    if (parts) range.endDate = toYmd(parts);
  }

  if (range.startDate || range.endDate) {
    return range;
  }

  const singleDate = resolveRelativeDateFromMessage(message);
  if (singleDate && /(?:부터|시작)/.test(message.replace(/\s+/g, ""))) {
    return { startDate: singleDate };
  }
  if (singleDate && /(?:까지|종료)/.test(message.replace(/\s+/g, ""))) {
    return { endDate: singleDate };
  }

  return {};
}

/** 월요일~일요일 (앱 예약 주간 뷰와 동일) */
export function getWeekRangeKst(weekOffset = 0): {
  startDate: string;
  endDate: string;
} {
  const todayParts = getKstDateParts();
  const today = new Date(todayParts.year, todayParts.month - 1, todayParts.day);
  const monday = getMonday(today);
  if (weekOffset !== 0) {
    monday.setDate(monday.getDate() + weekOffset * 7);
  }
  const sunday = getSunday(monday);

  return {
    startDate: toYmd({
      year: monday.getFullYear(),
      month: monday.getMonth() + 1,
      day: monday.getDate(),
    }),
    endDate: toYmd({
      year: sunday.getFullYear(),
      month: sunday.getMonth() + 1,
      day: sunday.getDate(),
    }),
  };
}
