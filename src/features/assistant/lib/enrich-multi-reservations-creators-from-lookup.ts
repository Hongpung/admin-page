import {
  resolveCreatorIdFromMemberLookup,
} from "@admin/features/assistant/lib/resolve-member-id-from-search";
import {
  normalizeAssistantActions,
  syncPrimaryAssistantAction,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import type { AssistantToolResultEntry } from "@admin/features/assistant/lib/assistant-tool-loop";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function withoutCreatorName(
  item: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...item };
  delete next.creatorName;
  return next;
}

function applyCreatorToReservationItem(
  item: Record<string, unknown>,
  toolResults: AssistantToolResultEntry[],
): Record<string, unknown> {
  const reservationType = item.reservationType;

  if (reservationType === "EXTERNAL") {
    const creatorName =
      typeof item.externalCreatorName === "string"
        ? item.externalCreatorName
        : typeof item.creatorName === "string"
          ? item.creatorName
          : null;
    if (!creatorName) return item;
    return {
      ...withoutCreatorName(item),
      externalCreatorName:
        typeof item.externalCreatorName === "string"
          ? item.externalCreatorName
          : creatorName,
    };
  }

  if (typeof item.creatorId === "number") {
    return withoutCreatorName(item);
  }

  const creatorName =
    typeof item.creatorName === "string" ? item.creatorName.trim() : "";
  if (!creatorName) return item;

  const creatorId = resolveCreatorIdFromMemberLookup(creatorName, toolResults);
  if (creatorId == null) {
    return item;
  }

  return {
    ...withoutCreatorName(item),
    creatorId,
    reservationType:
      reservationType === "COMMON" || reservationType === "REGULAR"
        ? reservationType
        : "REGULAR",
  };
}

export function enrichAnalysisWithMultiReservationCreatorsFromLookup(
  analysis: AssistantAnalysis,
  toolResults: AssistantToolResultEntry[],
): AssistantAnalysis {
  if (analysis.action?.type === "CREATE_RESERVATIONS_MULTI") {
    const payload = analysis.action.payload;
    if (!isPlainRecord(payload) || !Array.isArray(payload.reservations)) {
      return analysis;
    }

    const reservations = payload.reservations.map((item) =>
      isPlainRecord(item)
        ? applyCreatorToReservationItem(item, toolResults)
        : item,
    );

    return {
      ...analysis,
      action: {
        ...analysis.action,
        payload: {
          ...payload,
          reservations,
        },
      },
    };
  }

  const actions = normalizeAssistantActions(analysis).map((action) => {
    if (action.type !== "CREATE_RESERVATION") {
      return action;
    }

    const payload = action.payload;
    if (!isPlainRecord(payload)) {
      return action;
    }

    return {
      ...action,
      payload: applyCreatorToReservationItem(payload, toolResults),
    };
  });

  return syncPrimaryAssistantAction({
    ...analysis,
    actions,
  });
}
