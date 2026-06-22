import { buildMemberLookupSummary } from "@admin/features/assistant/lib/format-member-lookup-summary";
import {
  buildReservationLookupSummary,
  looksLikePendingLookup,
} from "@admin/features/assistant/lib/format-reservation-lookup-summary";
import { hasPendingCreatorMemberLookup } from "@admin/features/assistant/lib/build-creator-from-lookup";
import { hasPendingBannerLookup } from "@admin/features/assistant/lib/enrich-banner-from-lookup";
import { hasPendingNoticeLookup } from "@admin/features/assistant/lib/enrich-notice-from-lookup";
import { hasPendingReservationUpdateLookup } from "@admin/features/assistant/lib/enrich-reservation-from-lookup";
import {
  hasBannerDeleteIntent,
  hasBannerUpdateIntent,
} from "@admin/features/assistant/lib/assistant-banner-intent";
import {
  hasNoticeDeleteIntent,
  hasNoticeUpdateIntent,
} from "@admin/features/assistant/lib/assistant-notice-intent";
import { hasMemberSearchIntent } from "@admin/features/assistant/lib/assistant-member-intent";
import {
  hasReservationCancelIntent,
  hasReservationUpdateIntent,
} from "@admin/features/assistant/lib/assistant-reservation-intent";
import { inferPrefetchReadToolCalls } from "@admin/features/assistant/lib/infer-prefetch-read-tool-calls";
import { resolveAssistantAction } from "@admin/features/assistant/lib/resolve-assistant-action";
import type { AssistantToolResultEntry } from "@admin/features/assistant/lib/assistant-tool-loop";
import {
  getCurrentAssistantAction,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";

export const ASSISTANT_AGENT_MAX_ITERATIONS = 3;

export type AssistantAgentTerminalReason =
  | "confirm"
  | "need_input"
  | "invalid"
  | "manual"
  | "read_complete"
  | "loop_exhausted";

export type AssistantAgentPhaseResult =
  | { phase: "terminal"; reason: AssistantAgentTerminalReason }
  | { phase: "continue"; reason: string };

function isDeleteActionType(type: string | undefined): boolean {
  return type === "DELETE_RESERVATION" || type === "DELETE_RESERVATIONS_BATCH";
}

function hasSuccessfulMemberLookup(
  toolResults: AssistantToolResultEntry[],
): boolean {
  return toolResults.some(
    (result) => result.ok && result.toolId === "members_search_lookup",
  );
}

function hasUsableLookupSummary(toolResults: AssistantToolResultEntry[]): boolean {
  return (
    buildReservationLookupSummary(toolResults) !== null ||
    buildMemberLookupSummary(toolResults) !== null
  );
}

function isNoticeMutationActionType(type: string | undefined): boolean {
  return type === "UPDATE_NOTICE" || type === "DELETE_NOTICE";
}

function isBannerMutationActionType(type: string | undefined): boolean {
  return type === "UPDATE_BANNER" || type === "DELETE_BANNER";
}

function needsMoreReadTools(
  message: string,
  toolResults: AssistantToolResultEntry[],
): boolean {
  if (inferPrefetchReadToolCalls(message, toolResults).length > 0) {
    return true;
  }

  if (hasPendingCreatorMemberLookup(message, toolResults)) {
    return true;
  }

  if (hasPendingNoticeLookup(message, toolResults)) {
    return true;
  }

  if (hasPendingBannerLookup(message, toolResults)) {
    return true;
  }

  if (hasPendingReservationUpdateLookup(message, toolResults)) {
    return true;
  }

  if (hasMemberSearchIntent(message) && !hasSuccessfulMemberLookup(toolResults)) {
    return true;
  }

  return false;
}

export function isMandatoryReadPending(
  message: string,
  toolResults: AssistantToolResultEntry[],
): boolean {
  return needsMoreReadTools(message, toolResults);
}

export function evaluateAssistantAgentPhase(
  analysis: AssistantAnalysis,
  options: {
    message: string;
    toolResults: AssistantToolResultEntry[];
  },
): AssistantAgentPhaseResult {
  const { message, toolResults } = options;

  if (hasPendingNoticeLookup(message, toolResults)) {
    return { phase: "continue", reason: "notice_needs_lookup" };
  }

  if (hasPendingBannerLookup(message, toolResults)) {
    return { phase: "continue", reason: "banner_needs_lookup" };
  }

  if (hasPendingReservationUpdateLookup(message, toolResults)) {
    return { phase: "continue", reason: "reservation_update_needs_lookup" };
  }

  const actionState = resolveAssistantAction(analysis);

  if (actionState.kind === "confirm") {
    return { phase: "terminal", reason: "confirm" };
  }
  if (actionState.kind === "need_input") {
    if (hasPendingCreatorMemberLookup(message, toolResults)) {
      return { phase: "continue", reason: "creator_needs_lookup" };
    }
    if (hasPendingNoticeLookup(message, toolResults)) {
      return { phase: "continue", reason: "notice_needs_lookup" };
    }
    if (hasPendingBannerLookup(message, toolResults)) {
      return { phase: "continue", reason: "banner_needs_lookup" };
    }
    return { phase: "terminal", reason: "need_input" };
  }
  if (actionState.kind === "invalid") {
    return { phase: "terminal", reason: "invalid" };
  }
  if (actionState.kind === "manual") {
    return { phase: "terminal", reason: "manual" };
  }

  if (hasReservationCancelIntent(message)) {
    const hasDeleteAction = isDeleteActionType(
      getCurrentAssistantAction(analysis)?.type,
    );

    if (!hasDeleteAction && needsMoreReadTools(message, toolResults)) {
      return { phase: "continue", reason: "cancel_needs_lookup" };
    }

    if (hasDeleteAction) {
      return { phase: "terminal", reason: "confirm" };
    }

    if (hasSuccessfulMemberLookup(toolResults) || toolResults.some((r) => r.ok)) {
      return { phase: "terminal", reason: "read_complete" };
    }

    return { phase: "continue", reason: "cancel_needs_lookup" };
  }

  if (hasReservationUpdateIntent(message)) {
    const hasUpdateAction =
      getCurrentAssistantAction(analysis)?.type === "UPDATE_RESERVATION";

    if (!hasUpdateAction && hasPendingReservationUpdateLookup(message, toolResults)) {
      return { phase: "continue", reason: "reservation_update_needs_lookup" };
    }

    if (hasUpdateAction) {
      return { phase: "terminal", reason: "confirm" };
    }

    if (hasPendingReservationUpdateLookup(message, toolResults)) {
      return { phase: "continue", reason: "reservation_update_needs_lookup" };
    }
  }

  if (hasNoticeDeleteIntent(message) || hasNoticeUpdateIntent(message)) {
    const hasNoticeAction = isNoticeMutationActionType(
      getCurrentAssistantAction(analysis)?.type,
    );

    if (!hasNoticeAction && hasPendingNoticeLookup(message, toolResults)) {
      return { phase: "continue", reason: "notice_needs_lookup" };
    }

    if (hasNoticeAction) {
      return { phase: "terminal", reason: "confirm" };
    }

    if (hasPendingNoticeLookup(message, toolResults)) {
      return { phase: "continue", reason: "notice_needs_lookup" };
    }
  }

  if (hasBannerDeleteIntent(message) || hasBannerUpdateIntent(message)) {
    const hasBannerAction = isBannerMutationActionType(
      getCurrentAssistantAction(analysis)?.type,
    );

    if (!hasBannerAction && hasPendingBannerLookup(message, toolResults)) {
      return { phase: "continue", reason: "banner_needs_lookup" };
    }

    if (hasBannerAction) {
      return { phase: "terminal", reason: "confirm" };
    }

    if (hasPendingBannerLookup(message, toolResults)) {
      return { phase: "continue", reason: "banner_needs_lookup" };
    }
  }

  if (needsMoreReadTools(message, toolResults)) {
    return { phase: "continue", reason: "lookup_incomplete" };
  }

  if (
    looksLikePendingLookup(analysis.summary) &&
    hasUsableLookupSummary(toolResults)
  ) {
    return { phase: "continue", reason: "summary_not_materialized" };
  }

  if (looksLikePendingLookup(analysis.summary)) {
    return { phase: "continue", reason: "pending_lookup_summary" };
  }

  if (analysis.summary.trim()) {
    return { phase: "terminal", reason: "read_complete" };
  }

  return { phase: "continue", reason: "empty_summary" };
}

export function markAssistantAgentLoopExhausted(
  analysis: AssistantAnalysis,
): AssistantAnalysis {
  return {
    ...analysis,
    fallback_required: true,
    confidence: Math.min(analysis.confidence, 0.4),
    recommended_action:
      analysis.recommended_action.trim() ||
      "자동 분석을 완료하지 못했습니다. 요청을 조금 더 구체적으로 다시 입력하거나 관리 화면에서 직접 처리해주세요.",
    summary:
      analysis.summary.trim() ||
      "요청을 끝까지 처리하지 못했습니다. 조회나 실행에 필요한 정보가 부족할 수 있습니다.",
  };
}
