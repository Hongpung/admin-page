import {
  hasMultiReservationCreateIntent,
} from "@admin/features/assistant/lib/parse-multi-reservations-from-text";
import {
  hasNoticeCreateIntent,
  hasNoticeDeleteIntent,
  hasNoticeUpdateIntent,
} from "@admin/features/assistant/lib/assistant-notice-intent";
import {
  hasReservationBatchCreateIntent,
  hasReservationCreateIntent,
  hasReservationUpdateIntent,
} from "@admin/features/assistant/lib/assistant-reservation-intent";
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

export function extractReservationFieldsFromMessage(
  message: string,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  const date = resolveRelativeDate(message);
  if (date) patch.date = date;

  const clock = parseKoreanClock(message);
  if (clock) {
    const startTime = snapToTimeFormat(clock.hour, clock.minute);
    if (startTime) {
      patch.startTime = startTime;

      const durationMinutes = parseDurationMinutes(message);
      if (durationMinutes) {
        const endTime = addDurationToTime(startTime, durationMinutes);
        if (endTime) patch.endTime = endTime;
      }
    }
  }

  const explicitEnd = parseEndClock(message);
  if (explicitEnd) {
    patch.endTime = explicitEnd;
  }

  const title = extractTitle(message);
  if (title) patch.title = title;

  const reservationType = parseReservationTypeFromMessage(message);
  if (reservationType) patch.reservationType = reservationType;

  const normalized = message.replace(/\s+/g, "");
  if (/오픈\s*연습|합주\s*가능|참여\s*가능/.test(message)) {
    patch.participationAvailable = true;
  } else if (/연습|생성|등록|예약/.test(normalized)) {
    patch.participationAvailable = false;
  }

  return patch;
}

const CREATE_ACTION_TYPES = new Set([
  "CREATE_RESERVATION",
  "RESERVATION_BATCH_CREATE",
  "UNKNOWN",
  "NONE",
]);

export function enrichAnalysisWithReservationMessagePrefill(
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

  if (!hasReservationCreateIntent(message) || hasReservationUpdateIntent(message)) {
    return analysis;
  }

  if (hasReservationBatchCreateIntent(message)) {
    return analysis;
  }

  if (
    hasMultiReservationCreateIntent(message, analysis.detected_text)
  ) {
    return analysis;
  }

  const actionType = analysis.action?.type;
  if (actionType === "RESERVATION_BATCH_CREATE") {
    return analysis;
  }

  if (actionType === "CREATE_RESERVATIONS_MULTI") {
    return analysis;
  }

  if (actionType && !CREATE_ACTION_TYPES.has(actionType)) {
    return analysis;
  }

  const currentPayload = isPlainRecord(analysis.action?.payload)
    ? analysis.action.payload
    : {};
  const prefilled = mergeMissingFields(
    currentPayload,
    extractReservationFieldsFromMessage(message),
  );

  return {
    ...analysis,
    admin_action_required: true,
    action: {
      type: "CREATE_RESERVATION",
      payload: prefilled,
    },
  };
}
