import "server-only";

import {
  ASSISTANT_AGENT_MAX_ITERATIONS,
  evaluateAssistantAgentPhase,
  markAssistantAgentLoopExhausted,
} from "@admin/features/assistant/lib/assistant-agent-terminal";
import {
  applyDraftSnapshotToAnalysis,
  mergeAssistantAnalysisIntoDraft,
  mergeAssistantAnalysisIntoDraftWithPrefetch,
  evaluateAssistantDraft,
} from "@admin/features/assistant/lib/assistant-draft";
import {
  setAssistantDraft,
  getAssistantDraft,
} from "@admin/features/assistant/lib/assistant-draft-store";
import { enrichDraftWithClubLeaders } from "@admin/features/assistant/lib/enrich-batch-creators-from-club-leaders";
import { enrichAnalysisFromMessage } from "@admin/features/assistant/lib/enrich-analysis-from-message";
import { buildMemberLookupSummary } from "@admin/features/assistant/lib/format-member-lookup-summary";
import {
  buildReservationLookupSummary,
  looksLikePendingLookup,
} from "@admin/features/assistant/lib/format-reservation-lookup-summary";
import { hasMemberSearchIntent } from "@admin/features/assistant/lib/assistant-member-intent";
import { hasReservationCancelIntent, hasReservationUpdateIntent } from "@admin/features/assistant/lib/assistant-reservation-intent";
import {
  runAssistantReadToolLoop,
  shouldRunAssistantReadToolLoop,
  type AssistantToolResultEntry,
} from "@admin/features/assistant/lib/assistant-tool-loop";
import {
  continueAssistantModelTurn,
  type ContinueAssistantRequestInput,
} from "@admin/features/assistant/lib/google-genai";
import { prefetchAssistantReadTools } from "@admin/features/assistant/lib/prefetch-assistant-read-tools";
import {
  getCurrentAssistantAction,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import type { AssistantDraftKey } from "@admin/features/assistant/types/assistant-draft.types";
import type { AssistantAnalyzeProgressHandler } from "@admin/features/assistant/types/assistant-stream.types";

function toLookupResultEntries(
  toolResults: AssistantToolResultEntry[],
): ContinueAssistantRequestInput["toolResults"] {
  return toolResults.map(({ toolId, args, ok, message, data }) => ({
    toolId,
    args,
    ok,
    message,
    data,
  }));
}

function isReadOnlyAnalysis(analysis: AssistantAnalysis): boolean {
  const actionType = getCurrentAssistantAction(analysis)?.type;
  return !actionType || actionType === "NONE";
}

function applyLookupSummaryFallback(
  analysis: AssistantAnalysis,
  message: string,
  toolResults: AssistantToolResultEntry[],
): AssistantAnalysis {
  const actionType = getCurrentAssistantAction(analysis)?.type;
  if (
    hasReservationCancelIntent(message) ||
    hasReservationUpdateIntent(message) ||
    actionType === "DELETE_RESERVATION" ||
    actionType === "DELETE_RESERVATIONS_BATCH" ||
    actionType === "UPDATE_RESERVATION"
  ) {
    return analysis;
  }

  if (!looksLikePendingLookup(analysis.summary)) {
    return analysis;
  }

  const readOnly = isReadOnlyAnalysis(analysis);

  const reservationSummary = buildReservationLookupSummary(toolResults);
  if (reservationSummary) {
    return {
      ...analysis,
      summary: reservationSummary,
      ...(readOnly
        ? {
            admin_action_required: false,
            recommended_action: "",
            fallback_required: false,
          }
        : {}),
    };
  }

  if (hasMemberSearchIntent(message)) {
    const memberSummary = buildMemberLookupSummary(toolResults);
    if (memberSummary) {
      return {
        ...analysis,
        summary: memberSummary,
        ...(readOnly
          ? {
              admin_action_required: false,
              recommended_action: "",
              fallback_required: false,
            }
          : {}),
      };
    }
  }

  return analysis;
}

function shouldRunReadPhase(
  message: string,
  continueReason: string | null,
): boolean {
  if (!shouldRunAssistantReadToolLoop(message)) {
    return false;
  }

  if (!continueReason) {
    return true;
  }

  return [
    "lookup_incomplete",
    "cancel_needs_lookup",
    "creator_needs_lookup",
    "notice_needs_lookup",
    "banner_needs_lookup",
    "reservation_update_needs_lookup",
    "summary_not_materialized",
    "pending_lookup_summary",
    "empty_summary",
  ].includes(continueReason);
}

function finalizeAnalysis(
  analysis: AssistantAnalysis,
  message: string,
  toolResults: AssistantToolResultEntry[],
  draftKey?: AssistantDraftKey,
  options?: { lockDraftActions?: boolean },
  token?: string,
): Promise<AssistantAnalysis> {
  if (options?.lockDraftActions && draftKey) {
    const snapshot = evaluateAssistantDraft(getAssistantDraft(draftKey));
    const withSummary = applyLookupSummaryFallback(
      analysis,
      message,
      toolResults,
    );
    return Promise.resolve(applyDraftSnapshotToAnalysis(withSummary, snapshot));
  }

  const enriched = enrichAnalysisFromMessage(analysis, message, toolResults);
  const withSummary = applyLookupSummaryFallback(
    enriched,
    message,
    toolResults,
  );

  if (!draftKey) {
    return Promise.resolve(withSummary);
  }

  const mergeDraft = token
    ? mergeAssistantAnalysisIntoDraftWithPrefetch(
        draftKey,
        withSummary,
        token,
        message,
      )
    : Promise.resolve(mergeAssistantAnalysisIntoDraft(draftKey, withSummary));

  return mergeDraft.then(async (snapshot) => {
    const enrichedDraft = enrichDraftWithClubLeaders(snapshot.draft, toolResults);
    const finalSnapshot =
      enrichedDraft && enrichedDraft !== snapshot.draft
        ? evaluateAssistantDraft(enrichedDraft)
        : snapshot;

    if (enrichedDraft && enrichedDraft !== snapshot.draft) {
      setAssistantDraft(draftKey, finalSnapshot.draft ?? enrichedDraft);
    }

    return applyDraftSnapshotToAnalysis(withSummary, finalSnapshot);
  });
}

export async function runAssistantTextAnalysis(
  token: string,
  input: ContinueAssistantRequestInput & {
    draftKey?: AssistantDraftKey;
    lockDraftActions?: boolean;
    onProgress?: AssistantAnalyzeProgressHandler;
    signal?: AbortSignal;
  },
): Promise<{ analysis: AssistantAnalysis; aiCallsUsed: number }> {
  let toolResults: AssistantToolResultEntry[] = [];
  let readLoopText: string | null = null;
  let aiCallsUsed = 0;
  let analysis: AssistantAnalysis | null = null;
  let continueReason: string | null = null;

  for (
    let iteration = 0;
    iteration < ASSISTANT_AGENT_MAX_ITERATIONS;
    iteration += 1
  ) {
    if (input.signal?.aborted) {
      break;
    }

    if (shouldRunReadPhase(input.message, continueReason)) {
      input.onProgress?.({
        type: "status",
        message:
          iteration === 0
            ? "관련 정보를 조회하고 있어요…"
            : "조회 결과를 다시 확인하고 있어요…",
      });

      if (
        iteration === 0 ||
        continueReason === "lookup_incomplete" ||
        continueReason === "notice_needs_lookup" ||
        continueReason === "banner_needs_lookup"
      ) {
        toolResults = await prefetchAssistantReadTools(
          token,
          input.message,
          toolResults,
        );
      }

      const readLoop = await runAssistantReadToolLoop(
        token,
        input.message,
        toolResults,
      );
      toolResults = readLoop.toolResults;
      readLoopText = readLoop.assistantText;
      aiCallsUsed += readLoop.aiCallsUsed;

      if (readLoopText?.trim()) {
        input.onProgress?.({ type: "text", text: readLoopText.trim() });
      }
    }

    input.onProgress?.({
      type: "status",
      message:
        iteration === 0
          ? "요청을 분석하고 있어요…"
          : "실행 가능한 작업인지 다시 확인하고 있어요…",
    });

    const previousAction = analysis
      ? getCurrentAssistantAction(analysis)
      : undefined;
    const previousMissingFields = previousAction?.missing_fields ?? [];
    const structured = await continueAssistantModelTurn({
      ...input,
      toolResults: toLookupResultEntries(toolResults),
      readLoopText,
      missingFields:
        input.missingFields ??
        (previousMissingFields.length > 0 ? previousMissingFields : []),
    });
    aiCallsUsed += 1;
    analysis = await finalizeAnalysis(
      structured.analysis,
      input.message,
      toolResults,
      input.draftKey,
      { lockDraftActions: input.lockDraftActions },
      token,
    );

    if (!analysis) {
      continue;
    }

    const phase = evaluateAssistantAgentPhase(analysis, {
      message: input.message,
      toolResults,
    });

    if (phase.phase === "terminal") {
      return { analysis, aiCallsUsed };
    }

    continueReason = phase.reason;
  }

  const fallbackAnalysis = markAssistantAgentLoopExhausted(
    analysis ??
      ({
        summary: "",
        detected_text: "",
        admin_action_required: false,
        recommended_action: "",
        confidence: 0,
        fallback_required: true,
        action: { type: "UNKNOWN" },
        actions: [{ type: "UNKNOWN" }],
      } satisfies AssistantAnalysis),
  );

  return {
    analysis: await finalizeAnalysis(
      fallbackAnalysis,
      input.message,
      toolResults,
      input.draftKey,
      { lockDraftActions: input.lockDraftActions },
      token,
    ),
    aiCallsUsed,
  };
}
