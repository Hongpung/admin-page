import {
  hasReservationUpdateIntent,
} from "@admin/features/assistant/lib/assistant-reservation-intent";
import {
  collectReservations,
  selectReservationsForUpdate,
} from "@admin/features/assistant/lib/build-cancel-action-from-lookup";
import { extractReservationUpdateFieldsFromMessage } from "@admin/features/assistant/lib/prefill-reservation-update-from-message";
import type { AssistantToolResultEntry } from "@admin/features/assistant/lib/assistant-tool-loop";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";

const LOOKUP_TOOL_IDS = new Set([
  "reservations_by_date_lookup",
  "reservations_by_term_lookup",
  "reservations_by_week_lookup",
]);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isEmptyField(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function mergeMissingFields(
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

export function extractReservationIdFromMessage(message: string): number | null {
  const patterns = [
    /예약\s*(?:id|ID|아이디)\s*[:#]?\s*(\d{1,9})/i,
    /(?:id|ID|아이디)\s*[:#]?\s*(\d{1,9})\s*(?:번\s*)?예약/,
    /예약\s*(\d{1,9})\s*번/,
    /#(\d{1,9})\s*예약/,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (!match) continue;
    const id = Number(match[1]);
    if (Number.isInteger(id) && id > 0) return id;
  }

  return null;
}

function isUpdateMutationActionType(type: string | undefined): boolean {
  return type === "UPDATE_RESERVATION";
}

function hasUpdatePatchFields(payload: Record<string, unknown>): boolean {
  const keys = [
    "title",
    "date",
    "startTime",
    "endTime",
    "reservationType",
    "participationAvailable",
    "creatorId",
    "externalCreatorName",
  ];
  return keys.some((key) => !isEmptyField(payload[key]));
}

export function enrichAnalysisWithReservationFromLookup(
  analysis: AssistantAnalysis,
  message: string,
  toolResults: AssistantToolResultEntry[],
): AssistantAnalysis {
  if (!hasReservationUpdateIntent(message)) {
    return analysis;
  }

  const explicitId = extractReservationIdFromMessage(message);
  const currentPayload = isPlainRecord(analysis.action?.payload)
    ? analysis.action.payload
    : {};
  const patchFields = mergeMissingFields(
    currentPayload,
    extractReservationUpdateFieldsFromMessage(message),
  );

  if (explicitId !== null) {
    const prefilled = mergeMissingFields(patchFields, { reservationId: explicitId });
    return {
      ...analysis,
      admin_action_required: true,
      fallback_required: false,
      confidence: Math.max(analysis.confidence, 0.9),
      recommended_action:
        analysis.recommended_action.trim() ||
        "아래 내용을 확인한 뒤 승인하면 예약이 수정됩니다.",
      summary:
        analysis.summary.trim() ||
        `예약 #${explicitId} 수정을 준비합니다.`,
      action: {
        type: "UPDATE_RESERVATION",
        payload: prefilled,
      },
    };
  }

  const reservations = collectReservations(toolResults);
  const selected = selectReservationsForUpdate(message, reservations);

  if (selected.length === 0) {
    const lookedUp = toolResults.some(
      (result) => result.ok && LOOKUP_TOOL_IDS.has(result.toolId),
    );
    if (lookedUp) {
      const actionType = analysis.action?.type;
      if (!isUpdateMutationActionType(actionType)) {
        return {
          ...analysis,
          summary: analysis.summary.trim() || "수정할 예약을 찾지 못했습니다.",
          admin_action_required: false,
          recommended_action: "",
          action: { type: "NONE" },
        };
      }
    }
    return analysis;
  }

  if (selected.length > 1) {
    const titles = selected
      .map((item) => item.title ?? `#${item.reservationId}`)
      .join(", ");
    return {
      ...analysis,
      summary:
        analysis.summary.trim() ||
        `조건에 맞는 예약이 ${selected.length}건입니다 (${titles}). 어떤 예약을 수정할지 구체적으로 알려주세요.`,
      admin_action_required: false,
      recommended_action: "예약 제목·날짜·시간을 더 구체적으로 입력해주세요.",
      action: { type: "NONE" },
    };
  }

  const target = selected[0]!;
  const prefilled = mergeMissingFields(patchFields, {
    reservationId: target.reservationId,
  });

  const titleLabel = target.title?.trim() || `예약 #${target.reservationId}`;
  const summary =
    analysis.summary.trim() ||
    `'${titleLabel}' 예약(#${target.reservationId}) 수정을 준비합니다.`;

  return {
    ...analysis,
    admin_action_required: true,
    fallback_required: false,
    confidence: Math.max(analysis.confidence, 0.9),
    recommended_action:
      analysis.recommended_action.trim() ||
      "아래 내용을 확인한 뒤 승인하면 예약이 수정됩니다.",
    summary,
    action: {
      type: "UPDATE_RESERVATION",
      payload: prefilled,
    },
  };
}

export function hasPendingReservationUpdateLookup(
  message: string,
  toolResults: AssistantToolResultEntry[],
): boolean {
  if (!hasReservationUpdateIntent(message)) {
    return false;
  }
  if (extractReservationIdFromMessage(message) !== null) {
    return false;
  }
  return !toolResults.some(
    (result) => result.ok && LOOKUP_TOOL_IDS.has(result.toolId),
  );
}

export function updatePayloadIsReady(payload: Record<string, unknown> | undefined): boolean {
  if (!payload) return false;
  return (
    typeof payload.reservationId === "number" &&
    payload.reservationId > 0 &&
    hasUpdatePatchFields(payload)
  );
}
