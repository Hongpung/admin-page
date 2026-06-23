import {
  addDays,
  getKstDateParts,
  getKstTodayYmd,
  toYmd,
} from "@admin/features/assistant/lib/assistant-date-range";
import { snapToTimeFormat } from "@admin/features/assistant/lib/prefill-message-utils";
import { TimeArray } from "@admin/features/reservation/constants/constants";

/** 예약 시스템(TimeArray) 최소 시작 시각 */
export const ASSISTANT_MIN_RESERVATION_START_TIME = "10:00";

/** 예약 시스템(TimeArray) 최대 종료 시각 */
export const ASSISTANT_MAX_RESERVATION_END_TIME = "22:00";

export type ReservationPayloadClampResult = {
  payload: Record<string, unknown>;
  adjustments: string[];
  blocked?: { message: string };
};

function parseHmToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;

  return hours * 60 + minutes;
}

function getMinReservationStartDateYmd(): string {
  return toYmd(addDays(getKstDateParts(), 1));
}

function isBeforeMinStartDate(ymd: string): boolean {
  return ymd < getMinReservationStartDateYmd();
}

function isTodayYmd(ymd: string): boolean {
  return ymd === getKstTodayYmd();
}

function snapStartTimeToAllowedRange(startTime: string): string {
  const trimmed = startTime.trim();
  if (!trimmed) return trimmed;

  if ((TimeArray as readonly string[]).includes(trimmed)) {
    const minMinutes = parseHmToMinutes(ASSISTANT_MIN_RESERVATION_START_TIME);
    const currentMinutes = parseHmToMinutes(trimmed);
    if (
      minMinutes !== null &&
      currentMinutes !== null &&
      currentMinutes < minMinutes
    ) {
      return ASSISTANT_MIN_RESERVATION_START_TIME;
    }
    return trimmed;
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return trimmed;

  const snapped = snapToTimeFormat(Number(match[1]), Number(match[2]));
  return snapped ?? ASSISTANT_MIN_RESERVATION_START_TIME;
}

/**
 * endTime이 22:00을 초과하면 22:00으로 보정합니다.
 * 스키마(TimeArray)에 없는 23:00 등도 여기서 걸러집니다.
 */
export function clampAssistantReservationEndTime(endTime: string): string {
  const trimmed = endTime.trim();
  if (!trimmed) return trimmed;

  const endMinutes = parseHmToMinutes(trimmed);
  const maxMinutes = parseHmToMinutes(ASSISTANT_MAX_RESERVATION_END_TIME);
  if (endMinutes === null || maxMinutes === null) return trimmed;
  if (endMinutes > maxMinutes) return ASSISTANT_MAX_RESERVATION_END_TIME;

  return trimmed;
}

export function clampAssistantReservationStartTime(startTime: string): string {
  return snapStartTimeToAllowedRange(startTime);
}

function formatTimeAdjustment(
  label: string,
  beforeStart: string,
  beforeEnd: string,
  afterStart: string,
  afterEnd: string,
): string {
  return `${label} ${beforeStart}~${beforeEnd} → ${afterStart}~${afterEnd}`;
}

function clampDayTimeSlot(
  item: Record<string, unknown>,
  label: string,
): {
  item: Record<string, unknown> | null;
  adjustments: string[];
} {
  const adjustments: string[] = [];
  const beforeStart =
    typeof item.startTime === "string" ? item.startTime.trim() : "";
  const beforeEnd = typeof item.endTime === "string" ? item.endTime.trim() : "";

  if (!beforeStart || !beforeEnd) {
    return { item, adjustments };
  }

  const afterStart = clampAssistantReservationStartTime(beforeStart);
  const afterEnd = clampAssistantReservationEndTime(beforeEnd);

  if (afterStart !== beforeStart || afterEnd !== beforeEnd) {
    adjustments.push(
      formatTimeAdjustment(label, beforeStart, beforeEnd, afterStart, afterEnd),
    );
  }

  const startMinutes = parseHmToMinutes(afterStart);
  const endMinutes = parseHmToMinutes(afterEnd);
  if (
    startMinutes !== null &&
    endMinutes !== null &&
    startMinutes >= endMinutes
  ) {
    adjustments.push(
      `${label} ${afterStart}~${afterEnd} 구간은 예약 가능 시간(10:00~22:00) 밖이라 제외했습니다.`,
    );
    return { item: null, adjustments };
  }

  return {
    item: {
      ...item,
      startTime: afterStart,
      endTime: afterEnd,
    },
    adjustments,
  };
}

function clampDurationRange(
  duration: Record<string, unknown>,
): {
  duration: Record<string, unknown>;
  adjustments: string[];
  blocked?: { message: string };
} {
  const startDate =
    typeof duration.startDate === "string" ? duration.startDate.trim() : "";
  const endDate =
    typeof duration.endDate === "string" ? duration.endDate.trim() : "";

  if (!startDate || !endDate) {
    return { duration, adjustments: [] };
  }

  const minStartDate = getMinReservationStartDateYmd();
  const adjustments: string[] = [];

  if (!isBeforeMinStartDate(endDate)) {
    if (isBeforeMinStartDate(startDate)) {
      const nextDuration = { ...duration, startDate: minStartDate };
      if (isTodayYmd(startDate)) {
        adjustments.push(
          "오늘은 예약할 수 없어 시작일을 내일로 조정했습니다.",
        );
      } else {
        adjustments.push(
          `시작일 ${startDate}은(는) 예약할 수 없어 ${minStartDate}부터 적용했습니다.`,
        );
      }
      return { duration: nextDuration, adjustments };
    }

    return { duration, adjustments };
  }

  if (startDate === endDate && isTodayYmd(startDate)) {
    return {
      duration,
      adjustments,
      blocked: {
        message:
          "오늘만 예약할 수는 없습니다. 예약은 최소 내일부터 가능합니다.",
      },
    };
  }

  if (startDate === endDate) {
    return {
      duration,
      adjustments,
      blocked: {
        message: `${startDate}은(는) 예약할 수 없는 날짜입니다. 최소 내일 이후 날짜를 선택해주세요.`,
      },
    };
  }

  return {
    duration,
    adjustments,
    blocked: {
      message:
        "요청하신 기간은 모두 오늘/과거 날짜라 예약할 수 없습니다. 최소 내일 이후 기간으로 다시 요청해주세요.",
    },
  };
}

function clampSingleDateField(
  date: string,
): {
  date: string;
  adjustments: string[];
  blocked?: { message: string };
} {
  const trimmed = date.trim();
  if (!trimmed) {
    return { date: trimmed, adjustments: [] };
  }

  if (!isBeforeMinStartDate(trimmed)) {
    return { date: trimmed, adjustments: [] };
  }

  if (isTodayYmd(trimmed)) {
    return {
      date: trimmed,
      adjustments: [],
      blocked: {
        message:
          "오늘만 예약할 수는 없습니다. 예약은 최소 내일부터 가능합니다.",
      },
    };
  }

  return {
    date: trimmed,
    adjustments: [],
    blocked: {
      message: `${trimmed}은(는) 예약할 수 없는 날짜입니다. 최소 내일 이후 날짜를 선택해주세요.`,
    },
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clampReservationRecord(
  payload: Record<string, unknown>,
  options: { includeDates: boolean },
): ReservationPayloadClampResult {
  const next: Record<string, unknown> = { ...payload };
  const adjustments: string[] = [];
  let blocked: { message: string } | undefined;

  if (options.includeDates) {
    if (typeof next.date === "string") {
      const dateResult = clampSingleDateField(next.date);
      next.date = dateResult.date;
      adjustments.push(...dateResult.adjustments);
      blocked = blocked ?? dateResult.blocked;
    }

    if (isPlainRecord(next.duration)) {
      const durationResult = clampDurationRange(next.duration);
      next.duration = durationResult.duration;
      adjustments.push(...durationResult.adjustments);
      blocked = blocked ?? durationResult.blocked;
    }
  }

  if (typeof next.startTime === "string" && typeof next.endTime === "string") {
    const slotResult = clampDayTimeSlot(
      {
        startTime: next.startTime,
        endTime: next.endTime,
      },
      "예약 시간",
    );
    if (slotResult.item) {
      next.startTime = slotResult.item.startTime;
      next.endTime = slotResult.item.endTime;
    }
    adjustments.push(...slotResult.adjustments);
    if (!slotResult.item) {
      blocked = blocked ?? {
        message:
          "요청하신 시간이 예약 가능 범위(10:00~22:00)를 벗어나 예약할 수 없습니다.",
      };
    }
  } else {
    if (typeof next.startTime === "string") {
      const before = next.startTime;
      const after = clampAssistantReservationStartTime(before);
      next.startTime = after;
      if (after !== before) {
        adjustments.push(`시작 시간 ${before} → ${after}`);
      }
    }
    if (typeof next.endTime === "string") {
      const before = next.endTime;
      const after = clampAssistantReservationEndTime(before);
      next.endTime = after;
      if (after !== before) {
        adjustments.push(`종료 시간 ${before} → ${after}`);
      }
    }
  }

  if (Array.isArray(next.dayTimes)) {
    const clampedDayTimes: unknown[] = [];
    const originalDayTimesLength = next.dayTimes.length;

    next.dayTimes.forEach((item, index) => {
      if (!isPlainRecord(item)) {
        clampedDayTimes.push(item);
        return;
      }

      const dayLabel =
        typeof item.day === "string" ? `${item.day}요일` : `요일 ${index + 1}`;
      const slotResult = clampDayTimeSlot(item, dayLabel);
      adjustments.push(...slotResult.adjustments);
      if (slotResult.item) {
        clampedDayTimes.push(slotResult.item);
      }
    });

    next.dayTimes = clampedDayTimes;
    if (clampedDayTimes.length === 0 && originalDayTimesLength > 0) {
      blocked = blocked ?? {
        message:
          "요청하신 요일·시간이 모두 예약 가능 범위(10:00~22:00)를 벗어나 예약할 수 없습니다.",
      };
    }
  }

  if (Array.isArray(next.reservations)) {
    const clampedReservations: unknown[] = [];
    for (const item of next.reservations) {
      if (!isPlainRecord(item)) {
        clampedReservations.push(item);
        continue;
      }

      const nested = clampReservationRecord(item, options);
      adjustments.push(...nested.adjustments);
      blocked = blocked ?? nested.blocked;
      clampedReservations.push(nested.payload);
    }
    next.reservations = clampedReservations;
  }

  return { payload: next, adjustments, blocked };
}

const DATE_CLAMP_ACTION_TYPES = new Set([
  "RESERVATION_BATCH_CREATE",
  "CREATE_RESERVATION",
  "CREATE_RESERVATIONS_MULTI",
]);

export function clampReservationPayload(
  payload: Record<string, unknown>,
  actionType?: string,
): ReservationPayloadClampResult {
  return clampReservationRecord(payload, {
    includeDates: actionType ? DATE_CLAMP_ACTION_TYPES.has(actionType) : true,
  });
}

function clampTimeFieldsOnly(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...payload };

  if (typeof next.startTime === "string" && typeof next.endTime === "string") {
    const slotResult = clampDayTimeSlot(
      {
        startTime: next.startTime,
        endTime: next.endTime,
      },
      "예약 시간",
    );
    if (slotResult.item) {
      next.startTime = slotResult.item.startTime;
      next.endTime = slotResult.item.endTime;
    }
  } else {
    if (typeof next.startTime === "string") {
      next.startTime = clampAssistantReservationStartTime(next.startTime);
    }
    if (typeof next.endTime === "string") {
      next.endTime = clampAssistantReservationEndTime(next.endTime);
    }
  }

  if (Array.isArray(next.dayTimes)) {
    next.dayTimes = next.dayTimes
      .map((item, index) => {
        if (!isPlainRecord(item)) return item;

        const dayLabel =
          typeof item.day === "string" ? `${item.day}요일` : `요일 ${index + 1}`;
        const slotResult = clampDayTimeSlot(item, dayLabel);
        return slotResult.item;
      })
      .filter((item) => item !== null);
  }

  if (Array.isArray(next.reservations)) {
    next.reservations = next.reservations.map((item) =>
      isPlainRecord(item) ? clampTimeFieldsOnly(item) : item,
    );
  }

  return next;
}

/** 예약 payload의 시간 필드만 보정 (normalize 단계용) */
export function clampReservationPayloadEndTimes(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return clampTimeFieldsOnly(payload);
}

export function appendAdjustmentNotesToSummary(
  summary: string,
  notes: string[],
): string {
  const base = summary.trim();
  if (notes.length === 0) return base;

  const note = [
    "아래 항목을 예약 가능 범위에 맞게 조정했습니다.",
    ...notes.map((item) => `- ${item}`),
  ].join("\n");

  if (!base) return note;
  if (base.includes("예약 가능 범위에 맞게 조정")) {
    return base;
  }
  return `${base}\n\n${note}`;
}
