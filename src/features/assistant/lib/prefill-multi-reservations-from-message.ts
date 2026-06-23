import {
  hasMultiReservationCreateIntent,
  parseMultiReservationsFromText,
  toMultiReservationPayload,
} from "@admin/features/assistant/lib/parse-multi-reservations-from-text";
import {
  hasNoticeCreateIntent,
  hasNoticeDeleteIntent,
  hasNoticeUpdateIntent,
} from "@admin/features/assistant/lib/assistant-notice-intent";
import {
  hasReservationBatchCreateIntent,
  hasReservationCreateIntent,
} from "@admin/features/assistant/lib/assistant-reservation-intent";
import {
  syncPrimaryAssistantAction,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";

export function enrichAnalysisWithMultiReservationMessagePrefill(
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

  if (!hasReservationCreateIntent(message)) {
    return analysis;
  }

  if (hasReservationBatchCreateIntent(message)) {
    return analysis;
  }

  const intentSources = [message, analysis.detected_text];
  if (!hasMultiReservationCreateIntent(...intentSources)) {
    return analysis;
  }

  const slots = parseMultiReservationsFromText(
    message,
    analysis.detected_text,
    analysis.summary,
  );
  if (slots.length < 2) {
    return analysis;
  }

  const reservations = toMultiReservationPayload(slots);
  const actions = reservations.map((payload) => ({
    type: "CREATE_RESERVATION" as const,
    payload,
  }));

  return syncPrimaryAssistantAction({
    ...analysis,
    admin_action_required: true,
    summary:
      analysis.summary.trim() ||
      `총 ${slots.length}건의 예약을 순서대로 생성합니다.`,
    actions,
    action: actions[0],
  });
}
