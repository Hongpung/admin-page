import {
  addDays,
  getKstDateParts,
  toYmd,
  type YmdDateParts,
} from "@admin/features/assistant/lib/assistant-date-range";
import {
  hasNoticeCreateIntent,
  hasNoticeDeleteIntent,
  hasNoticeUpdateIntent,
} from "@admin/features/assistant/lib/assistant-notice-intent";
import {
  hasReservationBatchCreateIntent,
} from "@admin/features/assistant/lib/assistant-reservation-intent";
import { normalizeReservationBatchActionPayload } from "@admin/features/assistant/lib/normalize-reservation-batch-payload";
import {
  addDurationToTime,
  extractTitle,
  isPlainRecord,
  mergeMissingFields,
  parseDurationMinutes,
  parseEndClock,
  parseKoreanClock,
  parseReservationTypeFromMessage,
  resolveRelativeDate,
  snapToTimeFormat,
} from "@admin/features/assistant/lib/prefill-message-utils";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";
import { syncPrimaryAssistantAction } from "@admin/features/assistant/types/assistant-analysis.types";
import {
  weekdays_ko,
  type TimeFormat,
  type WeekDay,
} from "@admin/features/reservation/constants/constants";

const WEEKDAY_CHAR_TO_KO: Record<string, WeekDay> = {
  월: "월",
  화: "화",
  수: "수",
  목: "목",
  금: "금",
  토: "토",
  일: "일",
};

function lastDayOfMonth(parts: Pick<YmdDateParts, "year" | "month">): YmdDateParts {
  const lastDay = new Date(parts.year, parts.month, 0).getDate();
  return { year: parts.year, month: parts.month, day: lastDay };
}

function nextCalendarMonth(parts: YmdDateParts): Pick<YmdDateParts, "year" | "month"> {
  if (parts.month === 12) {
    return { year: parts.year + 1, month: 1 };
  }
  return { year: parts.year, month: parts.month + 1 };
}

export function parseWeekDaysFromMessage(message: string): WeekDay[] {
  const days = new Set<WeekDay>();

  for (const match of Array.from(
    message.matchAll(/([월화수목금토일])\s*요\s*일/g),
  )) {
    const day = WEEKDAY_CHAR_TO_KO[match[1] ?? ""];
    if (day) days.add(day);
  }

  const compactMatch = message.match(
    /매\s*주\s*([월화수목금토일]{2,7})(?:요\s*일)?/,
  );
  if (compactMatch?.[1]) {
    for (const char of compactMatch[1]) {
      const day = WEEKDAY_CHAR_TO_KO[char];
      if (day) days.add(day);
    }
  }

  return weekdays_ko.filter((day) => days.has(day));
}

function resolveBatchStartDate(message: string): string {
  const explicit = resolveRelativeDate(message);
  if (explicit) return explicit;

  const normalized = message.replace(/\s+/g, "");
  const today = getKstDateParts();

  if (/다음\s*주\s*부터/.test(normalized)) {
    return toYmd(addDays(today, 7));
  }
  if (/이번\s*주\s*부터/.test(normalized)) {
    return toYmd(addDays(today, 1));
  }

  return toYmd(addDays(today, 1));
}

export function resolveBatchDurationFromMessage(message: string): {
  startDate?: string;
  endDate?: string;
} {
  const normalized = message.replace(/\s+/g, "");
  const today = getKstDateParts();
  const duration: { startDate?: string; endDate?: string } = {};

  if (/다음\s*달\s*까지/.test(normalized)) {
    duration.endDate = toYmd(lastDayOfMonth(nextCalendarMonth(today)));
  } else if (/이번\s*달\s*까지/.test(normalized)) {
    duration.endDate = toYmd(lastDayOfMonth(today));
  } else {
    const monthUntil = message.match(/(\d{1,2})\s*월\s*까지/);
    if (monthUntil) {
      const month = Number(monthUntil[1]);
      if (month >= 1 && month <= 12) {
        let year = today.year;
        if (month < today.month) {
          year += 1;
        }
        duration.endDate = toYmd(lastDayOfMonth({ year, month }));
      }
    }
  }

  const isoEnd = message.match(/(?:까지|~|-)\s*(\d{4}-\d{2}-\d{2})/);
  if (isoEnd?.[1]) {
    duration.endDate = isoEnd[1];
  }

  duration.startDate = resolveBatchStartDate(message);

  return duration;
}

export function extractBatchDayTimesFromMessage(
  message: string,
): Array<{ day: WeekDay; startTime: TimeFormat; endTime: TimeFormat }> {
  const days = parseWeekDaysFromMessage(message);
  if (days.length === 0) return [];

  const clock = parseKoreanClock(message);
  if (!clock) return [];

  const startTime = snapToTimeFormat(clock.hour, clock.minute);
  if (!startTime) return [];

  let endTime = parseEndClock(message);
  if (!endTime) {
    const durationMinutes = parseDurationMinutes(message);
    if (durationMinutes) {
      endTime = addDurationToTime(startTime, durationMinutes);
    }
  }
  if (!endTime) return [];

  return days.map((day) => ({ day, startTime, endTime }));
}

export function extractReservationBatchFieldsFromMessage(
  message: string,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  const dayTimes = extractBatchDayTimesFromMessage(message);
  if (dayTimes.length > 0) {
    patch.dayTimes = dayTimes;
  }

  const duration = resolveBatchDurationFromMessage(message);
  if (duration.startDate || duration.endDate) {
    patch.duration = duration;
  }

  const optionPatch: Record<string, unknown> = {};
  const title = extractTitle(message);
  if (title) optionPatch.title = title;

  const reservationType = parseReservationTypeFromMessage(message);
  if (reservationType) optionPatch.reservationType = reservationType;

  if (Object.keys(optionPatch).length > 0) {
    patch.batchReservationOption = optionPatch;
  }

  return patch;
}

function isEmptyDayTimes(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0;
}

function mergeBatchPayload(
  current: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...current };

  if (patch.dayTimes && isEmptyDayTimes(next.dayTimes)) {
    next.dayTimes = patch.dayTimes;
  }

  if (isPlainRecord(patch.duration)) {
    const currentDuration = isPlainRecord(next.duration) ? next.duration : {};
    next.duration = mergeMissingFields(currentDuration, patch.duration);
  }

  if (isPlainRecord(patch.batchReservationOption)) {
    const currentOption = isPlainRecord(next.batchReservationOption)
      ? next.batchReservationOption
      : {};
    next.batchReservationOption = mergeMissingFields(
      currentOption,
      patch.batchReservationOption,
    );
  }

  return next;
}

function applyBatchPrefillToAction(
  action: AssistantAnalysis["action"],
  prefilled: Record<string, unknown>,
  forceBatchType: boolean,
): AssistantAnalysis["action"] {
  const currentPayload = isPlainRecord(action?.payload) ? action.payload : {};
  const mergedPayload = normalizeReservationBatchActionPayload(
    "RESERVATION_BATCH_CREATE",
    mergeBatchPayload(currentPayload, prefilled),
  );

  if (
    action?.type === "RESERVATION_BATCH_CREATE" ||
    (forceBatchType &&
      (action?.type === "CREATE_RESERVATION" ||
        action?.type === "UNKNOWN" ||
        action?.type === "NONE" ||
        !action?.type))
  ) {
    return {
      ...action,
      type: "RESERVATION_BATCH_CREATE",
      payload: mergedPayload,
    };
  }

  return action;
}

export function enrichAnalysisWithReservationBatchMessagePrefill(
  analysis: AssistantAnalysis,
  message: string,
): AssistantAnalysis {
  if (
    hasNoticeCreateIntent(message) ||
    hasNoticeUpdateIntent(message) ||
    hasNoticeDeleteIntent(message)
  ) {
    return analysis;
  }

  const forceBatchType = hasReservationBatchCreateIntent(message);
  const isBatchMessage =
    forceBatchType ||
    analysis.action?.type === "RESERVATION_BATCH_CREATE" ||
    analysis.actions?.some((action) => action.type === "RESERVATION_BATCH_CREATE");

  if (!isBatchMessage) {
    return analysis;
  }

  const prefilled = extractReservationBatchFieldsFromMessage(message);
  if (Object.keys(prefilled).length === 0) {
    return analysis;
  }

  const actions = analysis.actions?.map((action) => {
    if (
      action.type !== "RESERVATION_BATCH_CREATE" &&
      !(forceBatchType && action.type === "CREATE_RESERVATION")
    ) {
      return action;
    }

    const currentPayload = isPlainRecord(action.payload) ? action.payload : {};
    return {
      ...action,
      type: "RESERVATION_BATCH_CREATE" as const,
      payload: normalizeReservationBatchActionPayload(
        "RESERVATION_BATCH_CREATE",
        mergeBatchPayload(currentPayload, prefilled),
      ),
    };
  });

  return syncPrimaryAssistantAction({
    ...analysis,
    admin_action_required: true,
    actions,
    action: applyBatchPrefillToAction(analysis.action, prefilled, forceBatchType),
  });
}
