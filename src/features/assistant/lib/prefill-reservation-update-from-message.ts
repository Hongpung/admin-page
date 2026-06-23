import {
  hasReservationCancelIntent,
  hasReservationUpdateIntent,
} from "@admin/features/assistant/lib/assistant-reservation-intent";
import {
  extractReservationFieldsFromMessage,
} from "@admin/features/assistant/lib/prefill-reservation-from-message";
import {
  isPlainRecord,
  mergeMissingFields,
  snapToTimeFormat,
} from "@admin/features/assistant/lib/prefill-message-utils";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";
import type { TimeFormat } from "@admin/features/reservation/constants/constants";

function parseUntilEndClock(message: string): TimeFormat | null {
  const match = message.match(/(\d{1,2})\s*시(?:\s*반|\s*(\d{1,2})\s*분)?\s*까지/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = match[2]
    ? Number(match[2])
    : match[0].includes("반")
      ? 30
      : 0;

  return snapToTimeFormat(hour, minute);
}

function parseLabeledClock(
  message: string,
  label: "종료" | "시작",
): TimeFormat | null {
  const pattern =
    label === "종료"
      ? /종료\s*(?:시간)?(?:을|를|은|이|:)?\s*(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/
      : /시작\s*(?:시간)?(?:을|를|은|이|:)?\s*(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/;
  const match = message.match(pattern);
  if (!match) return null;

  let hour = Number(match[2]);
  const minute = match[3] ? Number(match[3]) : 0;
  const ampm = match[1];
  if (ampm === "오후" && hour < 12) hour += 12;
  if (ampm === "오전" && hour === 12) hour = 0;
  if (!ampm && hour >= 1 && hour <= 6) hour += 12;

  return snapToTimeFormat(hour, minute);
}

export function extractReservationUpdateFieldsFromMessage(
  message: string,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  const untilEnd = parseUntilEndClock(message);
  if (untilEnd) {
    patch.endTime = untilEnd;
  }

  const endTime = parseLabeledClock(message, "종료");
  if (endTime) {
    patch.endTime = endTime;
  }

  const startTime = parseLabeledClock(message, "시작");
  if (startTime) {
    patch.startTime = startTime;
  }

  if (Object.keys(patch).length > 0) {
    return patch;
  }

  return extractReservationFieldsFromMessage(message);
}

const UPDATE_ACTION_TYPES = new Set(["UPDATE_RESERVATION", "UNKNOWN", "NONE"]);

export function enrichAnalysisWithReservationUpdateMessagePrefill(
  analysis: AssistantAnalysis,
  message: string,
): AssistantAnalysis {
  if (!hasReservationUpdateIntent(message) || hasReservationCancelIntent(message)) {
    return analysis;
  }

  const actionType = analysis.action?.type;
  if (actionType && !UPDATE_ACTION_TYPES.has(actionType)) {
    return analysis;
  }

  const currentPayload = isPlainRecord(analysis.action?.payload)
    ? analysis.action.payload
    : {};
  const prefilled = mergeMissingFields(
    currentPayload,
    extractReservationUpdateFieldsFromMessage(message),
  );

  return {
    ...analysis,
    admin_action_required: true,
    action: {
      type: "UPDATE_RESERVATION",
      payload: prefilled,
    },
  };
}
