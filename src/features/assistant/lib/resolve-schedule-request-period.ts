import { addDays, getKstDateParts, toYmd } from "@admin/features/assistant/lib/assistant-date-range";
import { extractScheduleDurationFromText } from "@admin/features/assistant/lib/assistant-schedule-extract";
import { extractDatedScheduleSlotsFromText } from "@admin/features/assistant/lib/extract-dated-schedule-slots";

export type ScheduleRequestPeriod = {
  startDate: string;
  endDate: string;
  inclusiveDays: number;
};

function resolveScheduleYear(message: string, detectedText: string): number {
  const combined = `${message}\n${detectedText}`;
  const yearMatch = combined.match(/(20\d{2})\s*년?/);
  if (yearMatch?.[1]) return Number(yearMatch[1]);
  return getKstDateParts().year;
}

export function countInclusiveDays(startDate: string, endDate: string): number {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const start = Date.UTC(startYear!, startMonth! - 1, startDay!);
  const end = Date.UTC(endYear!, endMonth! - 1, endDay!);
  return Math.floor((end - start) / 86_400_000) + 1;
}

function toYmdFromMonthDay(
  year: number,
  month: number,
  day: number,
): string {
  return toYmd({ year, month, day });
}

function extractKoreanDateRange(
  message: string,
  detectedText: string,
): { startDate: string; endDate: string } | null {
  const combined = `${message}\n${detectedText}`;
  const year = resolveScheduleYear(message, detectedText);

  const withYear = combined.match(
    /(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일\s*부터\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/,
  );
  if (withYear?.[1] && withYear[2] && withYear[3] && withYear[4] && withYear[5]) {
    return {
      startDate: toYmdFromMonthDay(
        Number(withYear[1]),
        Number(withYear[2]),
        Number(withYear[3]),
      ),
      endDate: toYmdFromMonthDay(
        Number(withYear[1]),
        Number(withYear[4]),
        Number(withYear[5]),
      ),
    };
  }

  const sameYearRange = combined.match(
    /(\d{1,2})\s*월\s*(\d{1,2})\s*일\s*부터\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/,
  );
  if (
    sameYearRange?.[1] &&
    sameYearRange[2] &&
    sameYearRange[3] &&
    sameYearRange[4]
  ) {
    return {
      startDate: toYmdFromMonthDay(
        year,
        Number(sameYearRange[1]),
        Number(sameYearRange[2]),
      ),
      endDate: toYmdFromMonthDay(
        year,
        Number(sameYearRange[3]),
        Number(sameYearRange[4]),
      ),
    };
  }

  const isoRange = combined.match(
    /(\d{4}-\d{2}-\d{2})\s*(?:부터|~|에서)\s*(\d{4}-\d{2}-\d{2})/,
  );
  if (isoRange?.[1] && isoRange[2]) {
    return { startDate: isoRange[1], endDate: isoRange[2] };
  }

  return null;
}

function extractOneWeekRangeFromStart(
  message: string,
  detectedText: string,
): { startDate: string; endDate: string } | null {
  const combined = `${message}\n${detectedText}`;
  if (!/한\s*주|1\s*주(?:일)?/.test(combined)) return null;

  const year = resolveScheduleYear(message, detectedText);
  const withYear = combined.match(
    /(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/,
  );
  if (withYear?.[1] && withYear[2] && withYear[3]) {
    const startDate = toYmdFromMonthDay(
      Number(withYear[1]),
      Number(withYear[2]),
      Number(withYear[3]),
    );
    const endParts = addDays(
      {
        year: Number(withYear[1]),
        month: Number(withYear[2]),
        day: Number(withYear[3]),
      },
      6,
    );
    return { startDate, endDate: toYmd(endParts) };
  }

  const monthDay = combined.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (monthDay?.[1] && monthDay[2]) {
    const startParts = {
      year,
      month: Number(monthDay[1]),
      day: Number(monthDay[2]),
    };
    return {
      startDate: toYmd(startParts),
      endDate: toYmd(addDays(startParts, 6)),
    };
  }

  const datedHeader = combined.match(/(\d{1,2})\/(\d{1,2})\s*\([월화수목금토일]\)/);
  if (datedHeader?.[1] && datedHeader[2]) {
    const startParts = {
      year,
      month: Number(datedHeader[1]),
      day: Number(datedHeader[2]),
    };
    return {
      startDate: toYmd(startParts),
      endDate: toYmd(addDays(startParts, 6)),
    };
  }

  return null;
}

function periodFromSlotSpan(
  message: string,
  detectedText: string,
): { startDate: string; endDate: string } | null {
  const slots = extractDatedScheduleSlotsFromText(message, detectedText);
  if (slots.length === 0) return null;

  const dates = slots.map((slot) => slot.date).sort();
  return {
    startDate: dates[0]!,
    endDate: dates[dates.length - 1]!,
  };
}

export function resolveScheduleRequestPeriod(
  message: string,
  detectedText: string,
): ScheduleRequestPeriod | null {
  const koreanRange = extractKoreanDateRange(message, detectedText);
  if (koreanRange) {
    return {
      ...koreanRange,
      inclusiveDays: countInclusiveDays(
        koreanRange.startDate,
        koreanRange.endDate,
      ),
    };
  }

  const duration = extractScheduleDurationFromText(`${message}\n${detectedText}`);
  if (duration) {
    return {
      ...duration,
      inclusiveDays: countInclusiveDays(duration.startDate, duration.endDate),
    };
  }

  const oneWeek = extractOneWeekRangeFromStart(message, detectedText);
  if (oneWeek) {
    return {
      ...oneWeek,
      inclusiveDays: countInclusiveDays(oneWeek.startDate, oneWeek.endDate),
    };
  }

  const slotSpan = periodFromSlotSpan(message, detectedText);
  if (slotSpan) {
    return {
      ...slotSpan,
      inclusiveDays: countInclusiveDays(slotSpan.startDate, slotSpan.endDate),
    };
  }

  return null;
}

/** 포함 일수가 7일을 초과하면 정기 BATCH가 적합합니다. */
export function isSchedulePeriodOverOneWeek(period: ScheduleRequestPeriod): boolean {
  return period.inclusiveDays > 7;
}

export function shouldUseBatchScheduleForPeriod(
  message: string,
  detectedText: string,
): boolean {
  const period = resolveScheduleRequestPeriod(message, detectedText);
  if (!period) return false;
  return isSchedulePeriodOverOneWeek(period);
}
