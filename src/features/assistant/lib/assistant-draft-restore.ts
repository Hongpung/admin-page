import {
  createQueuedAction,
  createQueuedActionId,
  evaluateDraftQueue,
  evaluateQueuedAction,
} from "@admin/features/assistant/lib/assistant-action-queue";
import {
  getAssistantDraft,
  setAssistantDraft,
} from "@admin/features/assistant/lib/assistant-draft-store";
import {
  normalizeAssistantActions,
  type AssistantAction,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import type {
  AssistantDraft,
  AssistantDraftKey,
  QueuedAssistantAction,
} from "@admin/features/assistant/types/assistant-draft.types";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isRestorableMutationAction(
  action: AssistantAction,
): action is AssistantAction & { type: QueuedAssistantAction["type"] } {
  return action.type !== "NONE" && action.type !== "UNKNOWN";
}

/**
 * in-memory draft가 사라졌을 때 클라이언트가 보낸 analysis.actions로 큐를 복원합니다.
 * action.id를 보존해 이후 patch의 actionId와 맞춥니다.
 */
export function restoreAssistantDraftFromAnalysis(
  key: AssistantDraftKey,
  analysis: AssistantAnalysis,
): AssistantDraft | null {
  const existing = getAssistantDraft(key);
  if (existing?.queue.length) {
    return existing;
  }

  const incoming = normalizeAssistantActions(analysis).filter(
    isRestorableMutationAction,
  );
  if (incoming.length === 0) {
    return null;
  }

  const now = new Date().toISOString();
  const queue = incoming.map((action) =>
    evaluateQueuedAction({
      ...createQueuedAction(
        action.type,
        isPlainRecord(action.payload) ? action.payload : {},
      ),
      id: action.id ?? createQueuedActionId(),
      attempts: action.attempts ?? 0,
      error: action.error,
    }),
  );

  const draft = evaluateDraftQueue({
    queue,
    revision: 1,
    updatedAt: now,
  });
  setAssistantDraft(key, draft);
  return draft;
}
