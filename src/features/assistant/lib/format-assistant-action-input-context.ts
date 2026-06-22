import { extractCreatorDisplayName } from "@admin/features/assistant/lib/apply-external-creator-fallback";
import type { AssistantInputFieldConfig } from "@admin/features/assistant/lib/assistant-input-field-config";
import type { AssistantMissingFieldItem } from "@admin/features/assistant/types/assistant-analysis.types";
import type { AssistantQueueProgress } from "@admin/features/assistant/types/assistant-draft.types";
import type { AssistantActionType } from "@admin/features/assistant/types/assistant-tool.types";

const WEEKDAY_ORDER = ["월", "화", "수", "목", "금", "토", "일"] as const;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readStringField(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

function formatDuration(value: unknown): string | null {
  if (!isPlainRecord(value)) return null;
  const startDate =
    typeof value.startDate === "string" ? value.startDate.trim() : "";
  const endDate = typeof value.endDate === "string" ? value.endDate.trim() : "";
  if (!startDate || !endDate) return null;
  return `${startDate} ~ ${endDate}`;
}

function summarizeDayTimes(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const slots = value
    .filter(isPlainRecord)
    .map((item) => ({
      day: typeof item.day === "string" ? item.day.trim() : "",
      startTime:
        typeof item.startTime === "string" ? item.startTime.trim() : "",
      endTime: typeof item.endTime === "string" ? item.endTime.trim() : "",
    }))
    .filter((item) => item.day && item.startTime && item.endTime)
    .sort(
      (left, right) =>
        WEEKDAY_ORDER.indexOf(left.day as (typeof WEEKDAY_ORDER)[number]) -
        WEEKDAY_ORDER.indexOf(right.day as (typeof WEEKDAY_ORDER)[number]),
    );

  if (slots.length === 0) return null;

  const timeKey = `${slots[0]!.startTime}–${slots[0]!.endTime}`;
  const sameTime = slots.every(
    (slot) => `${slot.startTime}–${slot.endTime}` === timeKey,
  );

  if (sameTime) {
    return `${slots.map((slot) => slot.day).join("·")} ${timeKey}`;
  }

  return slots
    .map((slot) => `${slot.day} ${slot.startTime}–${slot.endTime}`)
    .join(", ");
}

function appendQueueProgress(
  parts: string[],
  queueProgress?: AssistantQueueProgress | null,
): void {
  if (queueProgress && queueProgress.total > 1) {
    parts.push(`${queueProgress.index}/${queueProgress.total}번째 작업`);
  }
}

export function formatCreateReservationContextLine(
  payload: Record<string, unknown>,
  queueProgress?: AssistantQueueProgress | null,
): string {
  const parts: string[] = [];

  appendQueueProgress(parts, queueProgress);

  const date = readStringField(payload, "date");
  const startTime = readStringField(payload, "startTime");
  const endTime = readStringField(payload, "endTime");
  const title = readStringField(payload, "title");
  const creator = extractCreatorDisplayName(payload);

  if (date && startTime && endTime && title) {
    parts.push(`${date} ${startTime}–${endTime} · ${title}`);
  } else if (title) {
    parts.push(title);
  } else if (date) {
    parts.push(date);
  }

  if (creator) {
    parts.push(`담당 ${creator}`);
  }

  return parts.join(" · ");
}

export function formatReservationBatchContextLine(
  payload: Record<string, unknown>,
  queueProgress?: AssistantQueueProgress | null,
): string {
  const parts: string[] = [];

  appendQueueProgress(parts, queueProgress);

  const option = isPlainRecord(payload.batchReservationOption)
    ? payload.batchReservationOption
    : {};
  const title =
    readStringField(option, "title") || readStringField(option, "clubName");
  if (title) {
    parts.push(title);
  }

  const duration = formatDuration(payload.duration);
  if (duration) {
    parts.push(duration);
  }

  const dayTimes = summarizeDayTimes(payload.dayTimes);
  if (dayTimes) {
    parts.push(dayTimes);
  }

  return parts.join(" · ");
}

export function formatActionInputContextLine(
  actionType: AssistantActionType | undefined,
  payload: Record<string, unknown>,
  queueProgress?: AssistantQueueProgress | null,
): string {
  if (!actionType) return "";

  switch (actionType) {
    case "CREATE_RESERVATION":
      return formatCreateReservationContextLine(payload, queueProgress);
    case "RESERVATION_BATCH_CREATE":
      return formatReservationBatchContextLine(payload, queueProgress);
    default:
      return "";
  }
}

export function formatMissingFieldsContextMessage(
  contextLine: string,
  items: AssistantMissingFieldItem[],
  actionType?: AssistantActionType,
): string {
  if (items.length === 0) {
    return contextLine;
  }

  const missingLines = items
    .map((item) => `· ${item.label}: ${item.message}`)
    .join("\n");
  const header = contextLine ? `${contextLine}\n\n` : "";
  const subject =
    actionType === "RESERVATION_BATCH_CREATE"
      ? "이 정기 예약에 아직 필요한 항목"
      : "이 예약에 아직 필요한 항목";

  return `${header}${subject}:\n${missingLines}`;
}

const CONTEXT_ACTION_TYPES = new Set<AssistantActionType>([
  "CREATE_RESERVATION",
  "RESERVATION_BATCH_CREATE",
]);

export function buildInputCardContextConfig(
  payload: Record<string, unknown>,
  queueProgress: AssistantQueueProgress | null | undefined,
  items: AssistantMissingFieldItem[],
  actionType: AssistantActionType | undefined,
): AssistantInputFieldConfig | null {
  if (!actionType || !CONTEXT_ACTION_TYPES.has(actionType) || items.length === 0) {
    return null;
  }

  const contextLine = formatActionInputContextLine(
    actionType,
    payload,
    queueProgress,
  );
  const message = formatMissingFieldsContextMessage(
    contextLine,
    items,
    actionType,
  );
  if (!message.trim()) {
    return null;
  }

  return {
    path: "_reservation_context",
    label: "",
    message,
    widget: "info",
  };
}
