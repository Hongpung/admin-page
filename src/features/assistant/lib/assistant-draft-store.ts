import "server-only";

import type {
  AssistantDraft,
  AssistantDraftKey,
} from "@admin/features/assistant/types/assistant-draft.types";
import { createQueuedAction } from "@admin/features/assistant/lib/assistant-action-queue";

const DRAFT_TTL_MS = 1000 * 60 * 30;

type StoredDraft = {
  draft: AssistantDraft;
  expiresAt: number;
};

type LegacyAssistantDraft = {
  actionType: AssistantDraft["queue"][number]["type"] | null;
  payload: Record<string, unknown>;
  revision: number;
  updatedAt: string;
};

const draftStore = new Map<string, StoredDraft>();

function buildDraftKey({ adminId, roomId }: AssistantDraftKey): string {
  return `${adminId}:${roomId}`;
}

function pruneExpiredDrafts(now = Date.now()) {
  for (const [key, value] of Array.from(draftStore.entries())) {
    if (value.expiresAt <= now) {
      draftStore.delete(key);
    }
  }
}

function isLegacyDraft(value: unknown): value is LegacyAssistantDraft {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    "actionType" in candidate &&
    "payload" in candidate &&
    !("queue" in candidate)
  );
}

function normalizeStoredDraft(draft: AssistantDraft | LegacyAssistantDraft): AssistantDraft {
  if (!isLegacyDraft(draft)) {
    return draft;
  }

  if (!draft.actionType) {
    return {
      queue: [],
      revision: draft.revision,
      updatedAt: draft.updatedAt,
    };
  }

  return {
    queue: [createQueuedAction(draft.actionType, draft.payload)],
    revision: draft.revision,
    updatedAt: draft.updatedAt,
  };
}

export function getAssistantDraft(key: AssistantDraftKey): AssistantDraft | null {
  const now = Date.now();
  pruneExpiredDrafts(now);

  const stored = draftStore.get(buildDraftKey(key));
  if (!stored || stored.expiresAt <= now) {
    return null;
  }

  return normalizeStoredDraft(stored.draft);
}

export function setAssistantDraft(
  key: AssistantDraftKey,
  draft: AssistantDraft,
): AssistantDraft {
  draftStore.set(buildDraftKey(key), {
    draft,
    expiresAt: Date.now() + DRAFT_TTL_MS,
  });

  return draft;
}

export function clearAssistantDraft(key: AssistantDraftKey) {
  draftStore.delete(buildDraftKey(key));
}
