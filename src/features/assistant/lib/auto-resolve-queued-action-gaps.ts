import "server-only";

import {
  evaluateQueuedAction,
  mergePayload,
} from "@admin/features/assistant/lib/assistant-action-queue";
import { executeAssistantLookupTool } from "@admin/features/assistant/lib/execute-assistant-lookup-tool";
import {
  getAssistantLookupToolDefinition,
  validateAssistantLookupToolArgs,
} from "@admin/features/assistant/lib/assistant-lookup-tool-definitions";
import { enrichDraftWithClubLeaders } from "@admin/features/assistant/lib/enrich-batch-creators-from-club-leaders";
import { resolveCreatorFieldsInPayload } from "@admin/features/assistant/lib/resolve-creator-fields-on-patch";
import type { AssistantToolResultEntry } from "@admin/features/assistant/lib/assistant-tool-loop";
import type { AssistantLookupToolId } from "@admin/features/assistant/types/assistant-tool.types";
import type {
  ActionResolutionSession,
  ActionResolutionToolResult,
  QueuedAssistantAction,
} from "@admin/features/assistant/types/assistant-draft.types";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

import { extractBatchClubName } from "@admin/features/assistant/lib/extract-assistant-club-name";

function hasToolResult(
  results: ActionResolutionToolResult[],
  toolId: string,
  args: Record<string, unknown>
): boolean {
  return results.some(
    (entry) =>
      entry.toolId === toolId &&
      JSON.stringify(entry.args) === JSON.stringify(args)
  );
}

function needsCreatorId(action: QueuedAssistantAction): boolean {
  if (action.type === "RESERVATION_BATCH_CREATE") {
    const payload = isPlainRecord(action.payload) ? action.payload : {};
    const option = isPlainRecord(payload.batchReservationOption)
      ? payload.batchReservationOption
      : {};
    if (option.reservationType === "EXTERNAL") return false;
    return typeof option.creatorId !== "number";
  }

  if (action.type === "CREATE_RESERVATION") {
    const payload = isPlainRecord(action.payload) ? action.payload : {};
    if (payload.reservationType === "EXTERNAL") return false;
    return typeof payload.creatorId !== "number";
  }

  return false;
}

export function inferActionResolutionToolCalls(
  action: QueuedAssistantAction,
  existing: ActionResolutionToolResult[] = []
): Array<{ toolId: string; args: Record<string, unknown> }> {
  const calls: Array<{ toolId: string; args: Record<string, unknown> }> = [];

  if (!needsCreatorId(action)) {
    return calls;
  }

  if (action.type === "RESERVATION_BATCH_CREATE") {
    const payload = isPlainRecord(action.payload) ? action.payload : {};
    const option = isPlainRecord(payload.batchReservationOption)
      ? payload.batchReservationOption
      : {};
    const clubName = extractBatchClubName(payload);

    if (clubName) {
      const args = { clubName };
      if (!hasToolResult(existing, "club_leaders_lookup", args)) {
        calls.push({ toolId: "club_leaders_lookup", args });
      }
      return calls;
    }

    const creatorName =
      typeof option.creatorName === "string" ? option.creatorName.trim() : "";
    if (creatorName) {
      const args = { username: creatorName, page: 0, pageSize: 20 };
      if (!hasToolResult(existing, "members_search_lookup", args)) {
        calls.push({ toolId: "members_search_lookup", args });
      }
      return calls;
    }

    if (!hasToolResult(existing, "club_leaders_lookup", {})) {
      calls.push({ toolId: "club_leaders_lookup", args: {} });
    }
    return calls;
  }

  if (action.type === "CREATE_RESERVATION") {
    const payload = isPlainRecord(action.payload) ? action.payload : {};
    const creatorName =
      typeof payload.creatorName === "string"
        ? payload.creatorName.trim()
        : typeof payload.externalCreatorName === "string"
        ? payload.externalCreatorName.trim()
        : "";

    if (creatorName) {
      const args = { username: creatorName, page: 0, pageSize: 20 };
      if (!hasToolResult(existing, "members_search_lookup", args)) {
        calls.push({ toolId: "members_search_lookup", args });
      }
    }
  }

  return calls;
}

function toToolResultEntry(
  result: ActionResolutionToolResult
): AssistantToolResultEntry {
  return {
    callId: result.callId,
    toolId: result.toolId,
    args: result.args,
    ok: result.ok,
    message: result.message,
    data: result.data,
  };
}

function createToolCallId(name: string): string {
  return `${name}-${crypto.randomUUID()}`;
}

async function executeLookupToolCall(
  token: string,
  toolId: string,
  args: Record<string, unknown>
): Promise<Pick<ActionResolutionToolResult, "ok" | "message" | "data">> {
  const definition = getAssistantLookupToolDefinition(toolId);
  if (!definition) {
    return { ok: false, message: `지원하지 않는 조회 도구입니다: ${toolId}` };
  }

  const validated = validateAssistantLookupToolArgs(
    definition.id as AssistantLookupToolId,
    args
  );
  if (!validated.ok) {
    return { ok: false, message: validated.message };
  }

  try {
    const result = await executeAssistantLookupTool(
      token,
      definition.id,
      validated.data
    );
    return {
      ok: result.ok,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "조회 도구 실행 중 오류가 발생했습니다.",
    };
  }
}

async function executeInferredToolCalls(
  token: string,
  action: QueuedAssistantAction,
  session: ActionResolutionSession
): Promise<ActionResolutionToolResult[]> {
  const inferred = inferActionResolutionToolCalls(action, session.toolResults);
  if (inferred.length === 0) {
    return [];
  }

  const executed: ActionResolutionToolResult[] = [];

  for (const call of inferred) {
    const callId = createToolCallId(call.toolId);
    const result = await executeLookupToolCall(token, call.toolId, call.args);
    const entry: ActionResolutionToolResult = {
      callId,
      toolId: call.toolId,
      args: call.args,
      ...result,
    };
    session.toolResults.push(entry);
    executed.push(entry);
  }

  return executed;
}

async function applyToolResultsToAction(
  token: string,
  action: QueuedAssistantAction,
  toolResults: ActionResolutionToolResult[]
): Promise<QueuedAssistantAction> {
  if (toolResults.length === 0) {
    return action;
  }

  const entries = toolResults.map(toToolResultEntry);
  const draft = enrichDraftWithClubLeaders(
    {
      queue: [action],
      revision: 0,
      updatedAt: new Date().toISOString(),
    },
    entries
  );

  const enrichedItem = draft?.queue[0] ?? action;
  const payload = isPlainRecord(enrichedItem.payload)
    ? enrichedItem.payload
    : {};
  const resolvedPayload = await resolveCreatorFieldsInPayload(token, payload);

  return evaluateQueuedAction({
    ...enrichedItem,
    payload: resolvedPayload,
  });
}

export type AutoResolveQueuedActionResult = {
  action: QueuedAssistantAction;
  toolResults: ActionResolutionToolResult[];
  resolved: boolean;
};

/**
 * LLM/사용자 입력 전에 lookup tool 1회로 creatorId 등 gap을 자동 보완합니다.
 */
export async function autoResolveQueuedActionGaps(
  token: string,
  action: QueuedAssistantAction,
  session: ActionResolutionSession
): Promise<AutoResolveQueuedActionResult> {
  const evaluated = evaluateQueuedAction(action);
  if (evaluated.status === "ready") {
    return { action: evaluated, toolResults: [], resolved: true };
  }

  const executed = await executeInferredToolCalls(token, evaluated, session);
  const next = await applyToolResultsToAction(token, evaluated, executed);
  const finalAction = evaluateQueuedAction(next);

  return {
    action: finalAction,
    toolResults: executed,
    resolved: finalAction.status === "ready",
  };
}

export function mergeResolutionPayloadFromOutput(
  current: QueuedAssistantAction,
  output: { status: string; payload?: Record<string, unknown> }
): QueuedAssistantAction {
  if (output.status !== "ready" || !isPlainRecord(output.payload)) {
    return current;
  }

  if (Object.keys(output.payload).length === 0) {
    return current;
  }

  return {
    ...current,
    payload: mergePayload(
      isPlainRecord(current.payload) ? current.payload : {},
      output.payload
    ),
  };
}
