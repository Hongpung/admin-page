import {
  extractReservationCreatorName,
  needsMemberLookupForMessage,
  resolveMemberLookupUsername,
} from "@admin/features/assistant/lib/assistant-member-intent";
import { extractMemberNamesFromMultiReservationText } from "@admin/features/assistant/lib/parse-multi-reservations-from-text";
import { hasReservationCreateIntent } from "@admin/features/assistant/lib/assistant-reservation-intent";
import type { AssistantToolResultEntry } from "@admin/features/assistant/lib/assistant-tool-loop";
import {
  resolveCreatorIdFromMemberLookup,
} from "@admin/features/assistant/lib/resolve-member-id-from-search";
import {
  getCurrentAssistantAction,
  normalizeAssistantActions,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";

const CREATE_ACTION_TYPES = new Set([
  "CREATE_RESERVATION",
  "RESERVATION_BATCH_CREATE",
]);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function applyCreatorIdToPayload(
  actionType: string,
  payload: Record<string, unknown>,
  creatorId: number,
): Record<string, unknown> {
  if (actionType === "RESERVATION_BATCH_CREATE") {
    const option = isPlainRecord(payload.batchReservationOption)
      ? payload.batchReservationOption
      : {};
    return {
      ...payload,
      batchReservationOption: {
        ...option,
        creatorId,
        reservationType:
          option.reservationType === "EXTERNAL" ? option.reservationType : "REGULAR",
      },
    };
  }

  return {
    ...payload,
    creatorId,
    reservationType:
      payload.reservationType === "EXTERNAL" ? payload.reservationType : "REGULAR",
  };
}

function shouldEnrichCreator(
  analysis: AssistantAnalysis,
  message: string,
): boolean {
  if (analysis.action?.type === "CREATE_RESERVATIONS_MULTI") {
    return false;
  }

  const actionType = analysis.action?.type;
  if (!actionType || !CREATE_ACTION_TYPES.has(actionType)) {
    return hasReservationCreateIntent(message);
  }

  const payload = analysis.action?.payload;
  if (!isPlainRecord(payload)) return true;
  if (payload.reservationType === "EXTERNAL") return false;
  if (typeof payload.creatorId === "number") return false;

  const batchOption = payload.batchReservationOption;
  if (isPlainRecord(batchOption) && typeof batchOption.creatorId === "number") {
    return false;
  }

  return true;
}

export function enrichAnalysisWithCreatorFromLookup(
  analysis: AssistantAnalysis,
  message: string,
  toolResults: AssistantToolResultEntry[],
): AssistantAnalysis {
  if (!shouldEnrichCreator(analysis, message)) {
    return analysis;
  }

  const username =
    extractReservationCreatorName(message) ?? resolveMemberLookupUsername(message);
  if (!username) {
    return analysis;
  }

  const creatorId = resolveCreatorIdFromMemberLookup(username, toolResults);
  if (creatorId == null) {
    return analysis;
  }

  const actionType =
    analysis.action?.type && CREATE_ACTION_TYPES.has(analysis.action.type)
      ? analysis.action.type
      : "CREATE_RESERVATION";
  const currentPayload = isPlainRecord(analysis.action?.payload)
    ? analysis.action.payload
    : {};

  const nextPayload = applyCreatorIdToPayload(
    actionType,
    currentPayload,
    creatorId,
  );
  const nextAction = {
    type: actionType,
    payload: nextPayload,
  };
  const currentAction = getCurrentAssistantAction(analysis);
  const actions = normalizeAssistantActions(analysis);
  const nextActions =
    actions.length > 0
      ? actions.map((action) =>
          action === currentAction ||
          (action.type === currentAction?.type && action.payload === currentAction.payload)
            ? { ...action, ...nextAction }
            : action,
        )
      : [nextAction];

  return {
    ...analysis,
    admin_action_required: true,
    fallback_required: false,
    confidence: Math.max(analysis.confidence, 0.85),
    action: nextAction,
    actions: nextActions,
    summary:
      analysis.summary.trim() ||
      `${username}님(memberId ${creatorId})을 예약자로 예약을 준비합니다.`,
  };
}

function normalizeToken(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function hasLookupResultForUsername(
  username: string,
  toolResults: AssistantToolResultEntry[],
): boolean {
  return toolResults.some(
    (result) =>
      result.ok &&
      result.toolId === "members_search_lookup" &&
      typeof result.args.username === "string" &&
      normalizeToken(result.args.username) === normalizeToken(username),
  );
}

export function hasPendingCreatorMemberLookup(
  message: string,
  toolResults: AssistantToolResultEntry[],
): boolean {
  const multiNames = extractMemberNamesFromMultiReservationText(message);
  if (multiNames.length > 0) {
    return multiNames.some(
      (username) => !hasLookupResultForUsername(username, toolResults),
    );
  }

  if (!needsMemberLookupForMessage(message)) {
    return false;
  }

  const username = resolveMemberLookupUsername(message);
  if (!username) return false;

  return !hasLookupResultForUsername(username, toolResults);
}
