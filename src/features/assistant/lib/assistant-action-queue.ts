
import {
  getAssistantToolDefinition,
  resolveToolIdFromActionType,
} from "@admin/features/assistant/lib/assistant-tool-definitions";
import { analyzeAssistantToolSchemaGaps, isCreatorUserInputPath } from "@admin/features/assistant/lib/format-assistant-missing-fields";
import type { AssistantMissingFieldItem } from "@admin/features/assistant/types/assistant-analysis.types";
import {
  formatMemberLookupCandidatesMessage,
  MEMBER_LOOKUP_CANDIDATES_PAYLOAD_KEY,
  MEMBER_LOOKUP_QUERY_PAYLOAD_KEY,
  stripMemberLookupHintsFromPayload,
  type MemberLookupCandidate,
} from "@admin/features/assistant/lib/resolve-member-id-from-search";
import type {
  AssistantAction,
  AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import type {
  AssistantDraft,
  AssistantDraftPayload,
  AssistantQueueProgress,
  QueuedAssistantAction,
  QueuedAssistantActionStatus,
} from "@admin/features/assistant/types/assistant-draft.types";
import { isTerminalQueueStatus } from "@admin/features/assistant/types/assistant-draft.types";
import {
  expandAssistantActions,
  reservationBatchClubsLikelyMatch,
  resolveReservationBatchClubKey,
} from "@admin/features/assistant/lib/expand-assistant-actions";
import { normalizeReservationBatchActionPayload } from "@admin/features/assistant/lib/normalize-reservation-batch-payload";
import { clampReservationPayload } from "@admin/features/assistant/lib/clamp-reservation-end-time";
import type { AssistantActionType } from "@admin/features/assistant/types/assistant-tool.types";

const MUTATION_ACTIONS = [
  "RESERVATION_BATCH_CREATE",
  "CREATE_RESERVATION",
  "CREATE_RESERVATIONS_MULTI",
  "DELETE_RESERVATION",
  "DELETE_RESERVATIONS_BATCH",
  "UPDATE_RESERVATION",
  "CREATE_NOTICE",
  "UPDATE_NOTICE",
  "DELETE_NOTICE",
  "CREATE_BANNER",
  "UPDATE_BANNER",
  "DELETE_BANNER",
] as const;

function isMutationAction(
  value: AssistantActionType,
): value is (typeof MUTATION_ACTIONS)[number] {
  return MUTATION_ACTIONS.includes(value as (typeof MUTATION_ACTIONS)[number]);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function enrichCreatorGapItems(
  payload: Record<string, unknown>,
  gapItems: AssistantMissingFieldItem[],
): AssistantMissingFieldItem[] {
  const candidates = payload[MEMBER_LOOKUP_CANDIDATES_PAYLOAD_KEY];
  const query = payload[MEMBER_LOOKUP_QUERY_PAYLOAD_KEY];
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return gapItems;
  }
  if (typeof query !== "string" || !query.trim()) {
    return gapItems;
  }

  const message = formatMemberLookupCandidatesMessage(
    query,
    candidates as MemberLookupCandidate[],
  );

  return gapItems.map((item) => {
    if (!isCreatorUserInputPath(item.path)) {
      return item;
    }

    return {
      ...item,
      message,
      display: `${item.label}: ${message.split("\n")[0]}`,
    };
  });
}

function isEmptyPayload(value: unknown): boolean {
  return !isPlainRecord(value) || Object.keys(value).length === 0;
}

/** 큐 현재 액션에 병합할 때 단독으로는 새 액션을 만들지 않는 patch */
export function isInsubstantialActionPatch(
  actionType: QueuedAssistantAction["type"],
  payload: Record<string, unknown>,
): boolean {
  if (Object.keys(payload).length === 0) return true;

  if (actionType !== "CREATE_RESERVATION") {
    return false;
  }

  const identityKeys = ["title", "date", "startTime"] as const;
  const hasIdentity = identityKeys.some((key) => {
    const value = payload[key];
    return typeof value === "string" && value.trim().length > 0;
  });

  if (hasIdentity) return false;

  const keys = Object.keys(payload);
  return keys.every((key) => key === "endTime" || key === "creatorName");
}

function extractBatchSemanticKey(
  payload: unknown,
  sourceText?: string,
): string | null {
  if (!isPlainRecord(payload)) return null;
  return resolveReservationBatchClubKey(payload, sourceText);
}

function extractBatchDayKeys(payload: unknown): string[] {
  if (!isPlainRecord(payload) || !Array.isArray(payload.dayTimes)) {
    return [];
  }

  return payload.dayTimes
    .map((item) =>
      isPlainRecord(item) && typeof item.day === "string" ? item.day : null,
    )
    .filter((day): day is string => Boolean(day));
}

function reservationSlotKey(payload: Record<string, unknown>): string | null {
  const date = typeof payload.date === "string" ? payload.date : "";
  const startTime =
    typeof payload.startTime === "string" ? payload.startTime : "";
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!date || !startTime || !title) return null;
  return `${date}|${startTime}|${title}`;
}

function findCreateReservationQueueMatchIndex(
  queue: QueuedAssistantAction[],
  action: AssistantAction,
): number {
  if (action.type !== "CREATE_RESERVATION" || !isPlainRecord(action.payload)) {
    return -1;
  }

  const incomingKey = reservationSlotKey(action.payload);
  if (!incomingKey) return -1;

  return queue.findIndex((item) => {
    if (item.type !== "CREATE_RESERVATION" || isTerminalQueueStatus(item.status)) {
      return false;
    }
    if (!isPlainRecord(item.payload)) return false;
    return reservationSlotKey(item.payload) === incomingKey;
  });
}

function findSemanticQueueMatchIndex(
  queue: QueuedAssistantAction[],
  action: AssistantAction,
  sourceText?: string,
): number {
  if (action.type === "CREATE_RESERVATION") {
    return findCreateReservationQueueMatchIndex(queue, action);
  }

  if (action.type !== "RESERVATION_BATCH_CREATE") return -1;

  const incomingKey = extractBatchSemanticKey(action.payload, sourceText);
  const incomingDays = extractBatchDayKeys(action.payload);

  return queue.findIndex((item) => {
    if (item.type !== action.type || isTerminalQueueStatus(item.status)) {
      return false;
    }

    const queueKey = extractBatchSemanticKey(item.payload, sourceText);
    if (
      incomingKey &&
      queueKey &&
      reservationBatchClubsLikelyMatch(incomingKey, queueKey)
    ) {
      return true;
    }

    if (incomingDays.length === 0 || incomingKey || queueKey) {
      return false;
    }

    const queueDays = extractBatchDayKeys(item.payload);
    return incomingDays.some((day) => queueDays.includes(day));
  });
}

function mergeReservationArrays(
  current: unknown[],
  patch: unknown[],
): unknown[] {
  const next = [...current];
  for (let index = 0; index < patch.length; index += 1) {
    const patchItem = patch[index];
    const currentItem = next[index];
    if (isPlainRecord(patchItem) && isPlainRecord(currentItem)) {
      next[index] = mergePayload(
        currentItem as AssistantDraftPayload,
        patchItem as AssistantDraftPayload,
      );
      continue;
    }
    if (patchItem !== undefined) {
      next[index] = patchItem;
    }
  }
  return next;
}

export function mergePayload(
  current: AssistantDraftPayload,
  patch: AssistantDraftPayload,
): AssistantDraftPayload {
  const next: AssistantDraftPayload = { ...current };

  for (const [key, value] of Object.entries(patch)) {
    if (
      key === "reservations" &&
      Array.isArray(value) &&
      Array.isArray(next[key])
    ) {
      next[key] = mergeReservationArrays(
        next[key] as unknown[],
        value as unknown[],
      );
      continue;
    }

    if (isPlainRecord(value) && isPlainRecord(next[key])) {
      next[key] = mergePayload(
        next[key] as AssistantDraftPayload,
        value as AssistantDraftPayload,
      );
      continue;
    }

    next[key] = value;
  }

  return next;
}

export function createQueuedActionId(): string {
  return `action-${crypto.randomUUID()}`;
}

export function createQueuedAction(
  type: QueuedAssistantAction["type"],
  payload: AssistantDraftPayload = {},
): QueuedAssistantAction {
  return evaluateQueuedAction({
    id: createQueuedActionId(),
    type,
    payload,
    status: "pending",
    missingFields: [],
    missingFieldItems: [],
    attempts: 0,
  });
}

export function findCurrentQueuedAction(
  queue: QueuedAssistantAction[],
): QueuedAssistantAction | null {
  return queue.find((item) => !isTerminalQueueStatus(item.status)) ?? null;
}

export function findCurrentQueuedActionIndex(queue: QueuedAssistantAction[]): number {
  return queue.findIndex((item) => !isTerminalQueueStatus(item.status));
}

export function getQueueProgress(
  queue: QueuedAssistantAction[],
): AssistantQueueProgress | null {
  if (queue.length === 0) return null;

  const pending = queue.filter((item) => !isTerminalQueueStatus(item.status)).length;
  if (pending === 0) {
    return {
      index: queue.length,
      total: 0,
      pending,
    };
  }

  const currentIndex = findCurrentQueuedActionIndex(queue);
  const activeIndex =
    currentIndex === -1
      ? pending - 1
      : queue
          .slice(0, currentIndex + 1)
          .filter((item) => !isTerminalQueueStatus(item.status)).length - 1;

  return {
    index: activeIndex + 1,
    total: pending,
    pending,
  };
}

type QueuedMutationAction = AssistantAction & {
  type: QueuedAssistantAction["type"];
};

function normalizeIncomingAction<T extends QueuedMutationAction>(action: T): T {
  if (action.type !== "RESERVATION_BATCH_CREATE") {
    return action;
  }

  return {
    ...action,
    payload: normalizeReservationBatchActionPayload(
      action.type,
      action.payload,
    ),
  };
}

export function evaluateQueuedAction(
  action: QueuedAssistantAction,
): QueuedAssistantAction {
  if (isTerminalQueueStatus(action.status)) {
    return action;
  }

  const normalizedAction =
    action.type === "RESERVATION_BATCH_CREATE"
      ? {
          ...action,
          payload: normalizeReservationBatchActionPayload(
            action.type,
            action.payload,
          ),
        }
      : action;

  const toolId = resolveToolIdFromActionType(normalizedAction.type);
  if (!toolId) {
    return {
      ...normalizedAction,
      status: "needs_input",
      missingFields: ["action.type"],
      missingFieldItems: [],
    };
  }

  const definition = getAssistantToolDefinition(toolId);
  if (!definition) {
    return {
      ...normalizedAction,
      status: "needs_input",
      missingFields: ["tool"],
      missingFieldItems: [],
    };
  }

  const clamped = clampReservationPayload(
    isPlainRecord(normalizedAction.payload) ? normalizedAction.payload : {},
    normalizedAction.type,
  );

  if (clamped.blocked) {
    return {
      ...normalizedAction,
      status: "needs_input",
      payload: clamped.payload,
      missingFields: [],
      missingFieldItems: [],
      adjustmentNotes: clamped.adjustments,
      error: clamped.blocked.message,
    };
  }

  const rawPayload = clamped.payload;
  const adjustmentNotes = clamped.adjustments;
  const validationPayload =
    normalizedAction.type === "CREATE_RESERVATION"
      ? stripMemberLookupHintsFromPayload(rawPayload)
      : rawPayload;

  const parsed = definition.argsSchema.safeParse(validationPayload);
  if (!parsed.success) {
    const gapItems = enrichCreatorGapItems(
      rawPayload,
      analyzeAssistantToolSchemaGaps(toolId, validationPayload),
    );
    return {
      ...normalizedAction,
      status: "needs_input",
      missingFields: gapItems.map((item) => item.path),
      missingFieldItems: gapItems,
      payload: rawPayload,
      adjustmentNotes,
    };
  }

  return {
    ...normalizedAction,
    status: "ready",
    payload: parsed.data as AssistantDraftPayload,
    missingFields: [],
    missingFieldItems: [],
    adjustmentNotes: adjustmentNotes.length > 0 ? adjustmentNotes : undefined,
    error: undefined,
  };
}

export function evaluateDraftQueue(draft: AssistantDraft): AssistantDraft {
  const queue = draft.queue.map((item) => evaluateQueuedAction(item));
  return { ...draft, queue };
}

function mapQueueStatusToAnalysisStatus(
  status: QueuedAssistantActionStatus,
): NonNullable<AssistantAction["status"]> {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "error";
    case "cancelled":
      return "rejected";
    case "executing":
      return "executing";
    case "ready":
    case "confirming":
      return "ready";
    case "needs_input":
      return "needs_input";
    default:
      return "pending";
  }
}

export function queuedActionToAnalysisAction(
  action: QueuedAssistantAction,
): AssistantAction {
  return {
    id: action.id,
    type: action.type,
    payload: action.payload,
    missing_fields: action.missingFieldItems.map((item) => item.display),
    missing_field_items: action.missingFieldItems,
    status: mapQueueStatusToAnalysisStatus(action.status),
    error: action.error,
    attempts: action.attempts,
  };
}

export function mergeIncomingActionsIntoDraft(
  existing: AssistantDraft | null,
  incomingActions: AssistantAction[],
  sourceText?: string,
): AssistantDraft {
  const expandedIncoming = expandAssistantActions(incomingActions, sourceText);
  let mutationActions = expandedIncoming
    .filter(
      (action): action is QueuedMutationAction => isMutationAction(action.type),
    )
    .map(normalizeIncomingAction);

  const now = new Date().toISOString();

  if (!existing?.queue.length) {
    return evaluateDraftQueue({
      queue: mutationActions.map((action) =>
        createQueuedAction(
          action.type,
          isPlainRecord(action.payload) ? action.payload : {},
        ),
      ),
      revision: 1,
      updatedAt: now,
    });
  }

  const queue = [...existing.queue];
  const currentIndex = findCurrentQueuedActionIndex(queue);

  const remainingMutationActions: typeof mutationActions = [];
  for (const action of mutationActions) {
    if (!action.id) {
      const semanticIndex = findSemanticQueueMatchIndex(queue, action, sourceText);
      if (semanticIndex === -1) {
        remainingMutationActions.push(action);
        continue;
      }

      queue[semanticIndex] = evaluateQueuedAction({
        ...queue[semanticIndex]!,
        payload: mergePayload(
          queue[semanticIndex]!.payload,
          isPlainRecord(action.payload) ? action.payload : {},
        ),
        error: undefined,
      });
      continue;
    }

    const matchingIndex = queue.findIndex((item) => item.id === action.id);
    if (matchingIndex === -1) {
      remainingMutationActions.push(action);
      continue;
    }

    queue[matchingIndex] = evaluateQueuedAction({
      ...queue[matchingIndex]!,
      payload: mergePayload(
        queue[matchingIndex]!.payload,
        isPlainRecord(action.payload) ? action.payload : {},
      ),
      error: undefined,
    });
  }
  mutationActions = remainingMutationActions;

  if (currentIndex !== -1) {
    mutationActions = mutationActions.filter((action, index) => {
      const payload = isPlainRecord(action.payload) ? action.payload : {};
      if (index === 0) return true;
      if (isEmptyPayload(payload)) return false;
      return !isInsubstantialActionPatch(action.type, payload);
    });
  }

  if (currentIndex === -1) {
    queue.push(
      ...mutationActions.map((action) =>
        createQueuedAction(
          action.type,
          isPlainRecord(action.payload) ? action.payload : {},
        ),
      ),
    );
  } else if (mutationActions.length > 0) {
    const actionable = [...mutationActions];
    const head = actionable[0]!;
    const headPayload = isPlainRecord(head.payload) ? head.payload : {};

    const semanticIndex = findSemanticQueueMatchIndex(queue, head, sourceText);
    if (semanticIndex !== -1) {
      queue[semanticIndex] = evaluateQueuedAction({
        ...queue[semanticIndex]!,
        payload: mergePayload(queue[semanticIndex]!.payload, headPayload),
        error: undefined,
      });
      actionable.shift();
    } else {
      const currentKey = extractBatchSemanticKey(
        queue[currentIndex]!.payload,
        sourceText,
      );
      const headKey = extractBatchSemanticKey(headPayload, sourceText);
      const shouldMergeIntoCurrent =
        isInsubstantialActionPatch(head.type, headPayload) ||
        (head.type === queue[currentIndex]!.type &&
          (head.type !== "RESERVATION_BATCH_CREATE" ||
            (currentKey &&
              headKey &&
              reservationBatchClubsLikelyMatch(currentKey, headKey))));

      if (shouldMergeIntoCurrent) {
        queue[currentIndex] = evaluateQueuedAction({
          ...queue[currentIndex]!,
          payload: mergePayload(queue[currentIndex]!.payload, headPayload),
          error: undefined,
        });
        actionable.shift();
      }
    }

    for (const action of actionable) {
      queue.push(
        createQueuedAction(
          action.type,
          isPlainRecord(action.payload) ? action.payload : {},
        ),
      );
    }
  }

  return evaluateDraftQueue({
    ...existing,
    queue,
    revision: existing.revision + 1,
    updatedAt: now,
  });
}

export function patchCurrentQueuedAction(
  draft: AssistantDraft,
  patch: AssistantDraftPayload,
  actionId?: string,
): AssistantDraft {
  const queue = [...draft.queue];
  const currentIndex = actionId
    ? queue.findIndex((item) => item.id === actionId)
    : findCurrentQueuedActionIndex(queue);

  if (currentIndex === -1) {
    return draft;
  }

  queue[currentIndex] = evaluateQueuedAction({
    ...queue[currentIndex]!,
    payload: mergePayload(queue[currentIndex]!.payload, patch),
    error: undefined,
  });

  return evaluateDraftQueue({
    ...draft,
    queue,
    revision: draft.revision + 1,
    updatedAt: new Date().toISOString(),
  });
}

export function completeCurrentQueuedAction(draft: AssistantDraft): AssistantDraft {
  const queue = [...draft.queue];
  const currentIndex = findCurrentQueuedActionIndex(queue);
  if (currentIndex === -1) {
    return draft;
  }

  queue[currentIndex] = {
    ...queue[currentIndex]!,
    status: "completed",
    error: undefined,
  };

  return evaluateDraftQueue({
    ...draft,
    queue,
    revision: draft.revision + 1,
    updatedAt: new Date().toISOString(),
  });
}

export function failCurrentQueuedAction(
  draft: AssistantDraft,
  message: string,
  actionId?: string,
): AssistantDraft {
  const queue = [...draft.queue];
  const currentIndex = actionId
    ? queue.findIndex((item) => item.id === actionId)
    : findCurrentQueuedActionIndex(queue);

  if (currentIndex === -1) {
    return draft;
  }

  const current = queue[currentIndex]!;
  queue[currentIndex] = {
    ...current,
    status: "failed",
    error: message,
    attempts: current.attempts + 1,
  };

  return {
    ...draft,
    queue,
    revision: draft.revision + 1,
    updatedAt: new Date().toISOString(),
  };
}

export function retryCurrentQueuedAction(
  draft: AssistantDraft,
  actionId?: string,
): AssistantDraft {
  const queue = [...draft.queue];
  const currentIndex = actionId
    ? queue.findIndex((item) => item.id === actionId)
    : findCurrentQueuedActionIndex(queue);

  if (currentIndex === -1) {
    return draft;
  }

  queue[currentIndex] = evaluateQueuedAction({
    ...queue[currentIndex]!,
    status: "pending",
    error: undefined,
  });

  return evaluateDraftQueue({
    ...draft,
    queue,
    revision: draft.revision + 1,
    updatedAt: new Date().toISOString(),
  });
}

export function cancelCurrentQueuedAction(draft: AssistantDraft): AssistantDraft {
  const queue = [...draft.queue];
  const currentIndex = findCurrentQueuedActionIndex(queue);
  if (currentIndex === -1) {
    return draft;
  }

  queue[currentIndex] = {
    ...queue[currentIndex]!,
    status: "cancelled",
  };

  return evaluateDraftQueue({
    ...draft,
    queue,
    revision: draft.revision + 1,
    updatedAt: new Date().toISOString(),
  });
}

export function isDraftQueueComplete(draft: AssistantDraft | null): boolean {
  if (!draft?.queue.length) return true;
  return findCurrentQueuedAction(draft.queue) === null;
}

export function buildAnalysisActionsFromDraft(
  draft: AssistantDraft,
): AssistantAction[] {
  return draft.queue.map(queuedActionToAnalysisAction);
}

export function buildCurrentAnalysisFromDraft(
  draft: AssistantDraft,
): Pick<AssistantAnalysis, "action" | "actions"> {
  const actions = buildAnalysisActionsFromDraft(draft);
  const current = findCurrentQueuedAction(draft.queue);
  return {
    actions,
    action: current ? queuedActionToAnalysisAction(current) : undefined,
  };
}
