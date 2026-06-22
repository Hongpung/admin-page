import "server-only";

import {
  buildAnalysisActionsFromDraft,
  cancelCurrentQueuedAction,
  completeCurrentQueuedAction,
  evaluateDraftQueue,
  evaluateQueuedAction,
  failCurrentQueuedAction,
  findCurrentQueuedAction,
  findCurrentQueuedActionIndex,
  getQueueProgress,
  mergeIncomingActionsIntoDraft,
  patchCurrentQueuedAction,
  queuedActionToAnalysisAction,
  retryCurrentQueuedAction,
} from "@admin/features/assistant/lib/assistant-action-queue";
import { autoResolveQueuedActionGaps } from "@admin/features/assistant/lib/auto-resolve-queued-action-gaps";
import { prefetchCreatorsForDraftQueue } from "@admin/features/assistant/lib/prefetch-creators-for-draft-queue";
import { restoreAssistantDraftFromAnalysis } from "@admin/features/assistant/lib/assistant-draft-restore";
import { enrichCreateReservationFromDetectedText } from "@admin/features/assistant/lib/enrich-create-reservation-from-detected-text";
import {
  resolveQueuedActionPayload,
  shouldResolveQueuedAction,
} from "@admin/features/assistant/lib/assistant-action-resolution";
import {
  appendMissingFieldsToSummary,
  buildMissingFieldsRecommendedAction,
} from "@admin/features/assistant/lib/format-assistant-missing-fields";
import { appendAdjustmentNotesToSummary } from "@admin/features/assistant/lib/clamp-reservation-end-time";
import {
  getAssistantDraft,
  setAssistantDraft,
} from "@admin/features/assistant/lib/assistant-draft-store";
import {
  getCurrentAssistantAction,
  normalizeAssistantActions,
  syncPrimaryAssistantAction,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import type {
  AssistantDraft,
  AssistantDraftKey,
  AssistantDraftPayload,
  AssistantDraftSnapshot,
  QueuedAssistantAction,
} from "@admin/features/assistant/types/assistant-draft.types";
import { resolveToolIdFromActionType } from "@admin/features/assistant/lib/assistant-tool-definitions";
import {
  extractBatchClubName,
  matchAssistantClubNameFromText,
} from "@admin/features/assistant/lib/extract-assistant-club-name";

function formatClubRegularPracticeTitle(clubName: string): string {
  return `${clubName}의 정기 연습`;
}

function batchActionNeedsCreatorPrefetch(item: QueuedAssistantAction): boolean {
  if (item.type !== "RESERVATION_BATCH_CREATE") return false;

  const payload = isPlainRecord(item.payload) ? item.payload : {};
  const option = isPlainRecord(payload.batchReservationOption)
    ? payload.batchReservationOption
    : {};

  if (option.reservationType === "EXTERNAL") return false;
  return !(
    typeof option.creatorId === "number" &&
    Number.isInteger(option.creatorId) &&
    option.creatorId > 0
  );
}

export function enrichDraftBatchClubNamesFromMessage(
  draft: AssistantDraft,
  message: string,
  detectedText: string,
): AssistantDraft {
  const sourceText = `${message}\n${detectedText}`.trim();

  const queue = draft.queue.map((item) => {
    if (item.type !== "RESERVATION_BATCH_CREATE") return item;

    const payload = isPlainRecord(item.payload) ? item.payload : {};
    const option = isPlainRecord(payload.batchReservationOption)
      ? { ...payload.batchReservationOption }
      : {};

    if (
      typeof option.creatorId === "number" &&
      Number.isInteger(option.creatorId) &&
      option.creatorId > 0
    ) {
      return item;
    }

    const clubName =
      extractBatchClubName(payload, sourceText) ??
      matchAssistantClubNameFromText(sourceText);
    if (!clubName) return item;

    const resolvedClubName = matchAssistantClubNameFromText(clubName) ?? clubName;

    return {
      ...item,
      payload: {
        ...payload,
        batchReservationOption: {
          ...option,
          clubName: resolvedClubName,
          title:
            typeof option.title === "string" && option.title.trim()
              ? option.title
              : formatClubRegularPracticeTitle(resolvedClubName),
          reservationType:
            option.reservationType === "EXTERNAL"
              ? option.reservationType
              : "REGULAR",
        },
      },
    };
  });

  return { ...draft, queue };
}

export async function mergeAssistantAnalysisIntoDraftWithPrefetch(
  key: AssistantDraftKey,
  analysis: AssistantAnalysis,
  token: string,
  message: string,
): Promise<AssistantDraftSnapshot> {
  const snapshot = mergeAssistantAnalysisIntoDraft(key, analysis);
  const draft = getAssistantDraft(key);
  if (!draft?.queue.length) {
    return snapshot;
  }

  const needsCreatorPrefetch = draft.queue.some(batchActionNeedsCreatorPrefetch);
  if (!needsCreatorPrefetch) {
    return snapshot;
  }

  const withClubNames = enrichDraftBatchClubNamesFromMessage(
    draft,
    message,
    analysis.detected_text,
  );
  const prefetched = await prefetchCreatorsForDraftQueue(token, withClubNames);
  const finalSnapshot = buildSnapshot(prefetched);
  setAssistantDraft(key, finalSnapshot.draft ?? prefetched);
  return finalSnapshot;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function enrichDraftCreateReservationsFromDetectedText(
  draft: AssistantDraft,
  message: string,
  detectedText: string,
): AssistantDraft {
  if (!detectedText.trim()) {
    return draft;
  }

  const queue = draft.queue.map((item, index) => {
    if (item.type !== "CREATE_RESERVATION") {
      return item;
    }

    const payload = isPlainRecord(item.payload) ? item.payload : {};
    return evaluateQueuedAction({
      ...item,
      payload: enrichCreateReservationFromDetectedText(
        payload,
        message,
        detectedText,
        index,
      ),
    });
  });

  return evaluateDraftQueue({
    ...draft,
    queue,
  });
}

export async function enrichAndPrefetchScheduleDraftQueue(
  key: AssistantDraftKey,
  token: string,
  message: string,
  detectedText: string,
): Promise<AssistantDraftSnapshot> {
  const existing = getAssistantDraft(key);
  if (!existing?.queue.length) {
    return evaluateAssistantDraft(existing);
  }

  let draft = existing;
  if (detectedText.trim()) {
    draft = enrichDraftCreateReservationsFromDetectedText(
      draft,
      message,
      detectedText,
    );
  }

  draft = await prefetchCreatorsForDraftQueue(token, draft);
  const snapshot = buildSnapshot(draft);
  setAssistantDraft(key, snapshot.draft ?? draft);
  return snapshot;
}

function buildSnapshot(draft: AssistantDraft | null): AssistantDraftSnapshot {
  if (!draft?.queue.length) {
    return {
      draft,
      currentAction: null,
      missingFields: [],
      missingFieldItems: [],
      ready: false,
      queueProgress: null,
    };
  }

  const evaluated = evaluateDraftQueue(draft);
  const currentAction = findCurrentQueuedAction(evaluated.queue);

  return {
    draft: evaluated,
    currentAction,
    missingFields: currentAction?.missingFields ?? [],
    missingFieldItems: currentAction?.missingFieldItems ?? [],
    ready: currentAction?.status === "ready",
    queueProgress: getQueueProgress(evaluated.queue),
  };
}

export function evaluateAssistantDraft(
  draft: AssistantDraft | null
): AssistantDraftSnapshot {
  return buildSnapshot(draft);
}

export function mergeAssistantAnalysisIntoDraft(
  key: AssistantDraftKey,
  analysis: AssistantAnalysis
): AssistantDraftSnapshot {
  const incoming = normalizeAssistantActions(analysis);
  if (
    incoming.length === 0 ||
    incoming.every(
      (action) => action.type === "UNKNOWN" || action.type === "NONE"
    )
  ) {
    return evaluateAssistantDraft(getAssistantDraft(key));
  }

  const existing = getAssistantDraft(key);
  const merged = mergeIncomingActionsIntoDraft(
    existing,
    incoming,
    analysis.detected_text,
  );
  const enriched = enrichDraftCreateReservationsFromDetectedText(
    merged,
    analysis.detected_text,
    analysis.detected_text,
  );
  const snapshot = buildSnapshot(enriched);
  setAssistantDraft(key, snapshot.draft ?? enriched);
  return snapshot;
}

export function patchAssistantDraft(
  key: AssistantDraftKey,
  patch: AssistantDraftPayload,
  actionId?: string,
  analysis?: AssistantAnalysis,
): AssistantDraftSnapshot {
  if (analysis) {
    restoreAssistantDraftFromAnalysis(key, analysis);
  }

  const existing = getAssistantDraft(key);
  if (!existing?.queue.length) {
    return evaluateAssistantDraft(null);
  }

  const merged = patchCurrentQueuedAction(existing, patch, actionId);
  const snapshot = buildSnapshot(merged);
  setAssistantDraft(key, snapshot.draft ?? merged);
  return snapshot;
}

export type PatchAssistantDraftAndResolveInput = {
  key: AssistantDraftKey;
  patch: AssistantDraftPayload;
  actionId?: string;
  analysis?: AssistantAnalysis;
  token: string;
  userMessage: string;
  detectedText: string;
};

export type PatchAssistantDraftAndResolveResult = {
  snapshot: AssistantDraftSnapshot;
  aiCallsUsed: number;
};

/**
 * 사용자 입력 patch 후 CREATE_RESERVATION 등은 멤버 조회·payload 정규화를 이어서 수행합니다.
 */
export async function patchAssistantDraftAndResolve(
  input: PatchAssistantDraftAndResolveInput,
): Promise<PatchAssistantDraftAndResolveResult> {
  let snapshot = patchAssistantDraft(
    input.key,
    input.patch,
    input.actionId,
    input.analysis,
  );
  let aiCallsUsed = 0;
  const userPatchProvided = Object.keys(input.patch).length > 0;

  const draftAfterPatch = getAssistantDraft(input.key);
  if (draftAfterPatch) {
    const enriched = input.detectedText.trim()
      ? enrichDraftCreateReservationsFromDetectedText(
          draftAfterPatch,
          input.userMessage || input.detectedText,
          input.detectedText,
        )
      : draftAfterPatch;
    const prefetched = await prefetchCreatorsForDraftQueue(
      input.token,
      enriched,
    );
    snapshot = buildSnapshot(prefetched);
    setAssistantDraft(input.key, snapshot.draft ?? prefetched);
  }

  let current = snapshot.currentAction;
  if (current && !snapshot.ready) {
    const autoResolved = await autoResolveQueuedActionGaps(
      input.token,
      current,
      current.resolutionSession ?? {
        userMessage: input.userMessage,
        detectedText: input.detectedText,
        toolResults: [],
        llmTurns: 0,
        startedAt: new Date().toISOString(),
      },
    );
    if (autoResolved.toolResults.length > 0 || autoResolved.resolved) {
      const draft = getAssistantDraft(input.key);
      if (draft) {
        const queue = [...draft.queue];
        const index = findCurrentQueuedActionIndex(queue);
        if (index !== -1) {
          queue[index] = autoResolved.action;
        }
        const merged = evaluateDraftQueue({
          ...draft,
          queue,
          revision: draft.revision + 1,
          updatedAt: new Date().toISOString(),
        });
        snapshot = buildSnapshot(merged);
        setAssistantDraft(input.key, snapshot.draft ?? merged);
      }
    }
    current = snapshot.currentAction;
  }

  if (
    current &&
    shouldResolveQueuedAction(current) &&
    !snapshot.ready &&
    !userPatchProvided
  ) {
    const resolution = await resolveCurrentQueuedAction({
      token: input.token,
      key: input.key,
      userMessage: input.userMessage,
      detectedText: input.detectedText,
    });
    snapshot = resolution.snapshot;
    aiCallsUsed = resolution.aiCallsUsed;
  }

  return { snapshot, aiCallsUsed };
}

export function completeAssistantDraftCurrentAction(
  key: AssistantDraftKey
): AssistantDraftSnapshot {
  const existing = getAssistantDraft(key);
  if (!existing?.queue.length) {
    return evaluateAssistantDraft(null);
  }

  const merged = completeCurrentQueuedAction(existing);
  const snapshot = buildSnapshot(merged);
  setAssistantDraft(key, snapshot.draft ?? merged);
  return snapshot;
}

export function failAssistantDraftCurrentAction(
  key: AssistantDraftKey,
  message: string,
  actionId?: string
): AssistantDraftSnapshot {
  const existing = getAssistantDraft(key);
  if (!existing?.queue.length) {
    return evaluateAssistantDraft(null);
  }

  const merged = failCurrentQueuedAction(existing, message, actionId);
  const snapshot = buildSnapshot(merged);
  setAssistantDraft(key, snapshot.draft ?? merged);
  return snapshot;
}

export function retryAssistantDraftCurrentAction(
  key: AssistantDraftKey,
  actionId?: string
): AssistantDraftSnapshot {
  const existing = getAssistantDraft(key);
  if (!existing?.queue.length) {
    return evaluateAssistantDraft(null);
  }

  const merged = retryCurrentQueuedAction(existing, actionId);
  const snapshot = buildSnapshot(merged);
  setAssistantDraft(key, snapshot.draft ?? merged);
  return snapshot;
}

export function cancelAssistantDraftCurrentAction(
  key: AssistantDraftKey
): AssistantDraftSnapshot {
  const existing = getAssistantDraft(key);
  if (!existing?.queue.length) {
    return evaluateAssistantDraft(null);
  }

  const merged = cancelCurrentQueuedAction(existing);
  const snapshot = buildSnapshot(merged);
  setAssistantDraft(key, snapshot.draft ?? merged);
  return snapshot;
}

export function applyDraftSnapshotToAnalysis(
  analysis: AssistantAnalysis,
  snapshot: AssistantDraftSnapshot
): AssistantAnalysis {
  if (!snapshot.draft?.queue.length) {
    return analysis;
  }

  const current = snapshot.currentAction;
  const actions = buildAnalysisActionsFromDraft(snapshot.draft);
  const toolId = current ? resolveToolIdFromActionType(current.type) : null;
  const gapItems = current?.missingFieldItems ?? [];

  const queueHint =
    snapshot.queueProgress && snapshot.queueProgress.pending > 1
      ? ` (${snapshot.queueProgress.index}/${snapshot.queueProgress.total}번째 작업)`
      : "";

  const awaitingInput = Boolean(current && !snapshot.ready && gapItems.length > 0);
  const blockedMessage =
    current?.error && gapItems.length === 0 ? current.error : null;
  const summaryWithAdjustments = appendAdjustmentNotesToSummary(
    analysis.summary,
    current?.adjustmentNotes ?? [],
  );

  return syncPrimaryAssistantAction({
    ...analysis,
    actions,
    fallback_required: awaitingInput ? false : analysis.fallback_required,
    confidence:
      awaitingInput && current
        ? Math.max(analysis.confidence, 0.7)
        : analysis.confidence,
    summary:
      snapshot.ready || !current
        ? appendAdjustmentNotesToSummary(analysis.summary, current?.adjustmentNotes ?? [])
        : blockedMessage
          ? `${summaryWithAdjustments}\n\n${blockedMessage}`
          : appendMissingFieldsToSummary(summaryWithAdjustments, gapItems),
    admin_action_required: Boolean(current),
    action: current ? queuedActionToAnalysisAction(current) : undefined,
    recommended_action: !current
      ? ""
      : snapshot.ready
      ? `필드가 모두 확인되었습니다${queueHint}. 실행 전 변경 내용을 검토하고 승인해주세요.`
      : blockedMessage
        ? blockedMessage
        : buildMissingFieldsRecommendedAction(toolId, gapItems),
  });
}

export function applyDraftToAnalysis(
  analysis: AssistantAnalysis,
  draft: AssistantDraft | null
): AssistantAnalysis {
  return applyDraftSnapshotToAnalysis(analysis, buildSnapshot(draft));
}

/** UI/서버 공통: 현재 액션 기준으로 analysis를 재구성 */
export function refreshAnalysisFromDraft(
  analysis: AssistantAnalysis,
  key: AssistantDraftKey
): AssistantAnalysis {
  const draft = getAssistantDraft(key);
  return applyDraftToAnalysis(analysis, draft);
}

export type ResolveCurrentQueuedActionInput = {
  token: string;
  key: AssistantDraftKey;
  userMessage: string;
  detectedText?: string;
};

export type ResolveCurrentQueuedActionResult = {
  snapshot: AssistantDraftSnapshot;
  aiCallsUsed: number;
  resolved: boolean;
};

/**
 * 큐의 현재 액션 1건에 대해 tool↔LLM 루프로 payload를 정규화합니다.
 * 완료·실패·needs_input 도달 시 resolutionSession을 제거합니다.
 */
export async function resolveCurrentQueuedAction(
  input: ResolveCurrentQueuedActionInput,
): Promise<ResolveCurrentQueuedActionResult> {
  const draft = getAssistantDraft(input.key);
  const current = draft ? findCurrentQueuedAction(draft.queue) : null;

  if (!draft || !current) {
    return {
      snapshot: evaluateAssistantDraft(draft),
      aiCallsUsed: 0,
      resolved: false,
    };
  }

  const { action, aiCallsUsed } = await resolveQueuedActionPayload(
    input.token,
    current,
    {
      userMessage: input.userMessage,
      detectedText: input.detectedText ?? "",
    },
  );

  const queue = [...draft.queue];
  const index = findCurrentQueuedActionIndex(queue);
  if (index !== -1) {
    queue[index] = action;
  }

  const merged = evaluateDraftQueue({
    ...draft,
    queue,
    revision: draft.revision + 1,
    updatedAt: new Date().toISOString(),
  });
  const snapshot = buildSnapshot(merged);
  setAssistantDraft(input.key, snapshot.draft ?? merged);

  return {
    snapshot,
    aiCallsUsed,
    resolved: true,
  };
}

export { getCurrentAssistantAction };
