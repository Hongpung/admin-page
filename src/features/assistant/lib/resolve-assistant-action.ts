import {
  getAssistantToolDefinition,
  resolveToolIdFromActionType,
  validateAssistantToolArgs,
} from "@admin/features/assistant/lib/assistant-tool-definitions";
import {
  hasAssistantActionInputGap,
  isConcreteMutationAction,
} from "@admin/features/assistant/lib/assistant-action-input-state";
import { getPendingActionsAfterCurrent } from "@admin/features/assistant/lib/assistant-queue-progress";
import { getAssistantActionLabel } from "@admin/features/assistant/lib/get-assistant-action-label";
import {
  getCurrentAssistantAction,
  normalizeAssistantActions,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import type { AssistantActionState } from "@admin/features/assistant/types/assistant-tool.types";

function getQueueProgress(analysis: AssistantAnalysis) {
  const actions = normalizeAssistantActions(analysis);
  if (actions.length <= 1) return undefined;

  const terminal = new Set([
    "success",
    "error",
    "rejected",
    "completed",
    "cancelled",
  ]);
  const pending = actions.filter(
    (action) => !action.status || !terminal.has(action.status),
  ).length;
  if (pending === 0) {
    return {
      index: actions.length,
      total: 0,
      pending,
    };
  }
  const currentIndex = actions.findIndex(
    (action) => !action.status || !terminal.has(action.status),
  );
  const activeIndex =
    currentIndex === -1
      ? pending - 1
      : actions
          .slice(0, currentIndex + 1)
          .filter((action) => !action.status || !terminal.has(action.status))
          .length - 1;

  return {
    index: activeIndex + 1,
    total: pending,
    pending,
  };
}

export function resolveAssistantAction(
  analysis: AssistantAnalysis,
): AssistantActionState {
  const action = getCurrentAssistantAction(analysis);
  const pendingAfter = getPendingActionsAfterCurrent(analysis);
  const label = action ? getAssistantActionLabel(action.type) : "작업";

  if (!action || action.type === "NONE") {
    return { kind: "none" };
  }

  if (
    action.status === "success" ||
    action.status === "completed" ||
    action.status === "rejected" ||
    action.status === "cancelled"
  ) {
    return { kind: "none" };
  }

  if (action.status === "error") {
    return {
      kind: "failed",
      label,
      message: action.error?.trim() || "작업 실행에 실패했습니다.",
      actionId: action.id,
      analysis,
      canContinue: pendingAfter > 0,
      queueProgress: getQueueProgress(analysis),
    };
  }

  if (isConcreteMutationAction(action) && hasAssistantActionInputGap(action)) {
    return {
      kind: "need_input",
      fields: action.missing_fields ?? [],
      actionId: action.id,
      analysis,
      queueProgress: getQueueProgress(analysis),
    };
  }

  if (
    action.type === "UNKNOWN" ||
    analysis.fallback_required ||
    analysis.confidence < 0.5
  ) {
    return { kind: "manual", analysis };
  }

  const toolId = resolveToolIdFromActionType(action.type);
  if (!toolId) {
    if (pendingAfter > 0) {
      return {
        kind: "blocked",
        reason: "unsupported",
        label,
        message: `${label}은(는) 지원하지 않습니다.`,
        analysis,
        canContinue: true,
        queueProgress: getQueueProgress(analysis),
      };
    }

    return {
      kind: "invalid",
      message: "지원하지 않는 작업 유형입니다.",
      analysis,
    };
  }

  const definition = getAssistantToolDefinition(toolId);
  if (!definition) {
    if (pendingAfter > 0) {
      return {
        kind: "blocked",
        reason: "unsupported",
        label,
        message: "도구 정의를 찾을 수 없습니다.",
        analysis,
        canContinue: true,
        queueProgress: getQueueProgress(analysis),
      };
    }

    return {
      kind: "invalid",
      message: "도구 정의를 찾을 수 없습니다.",
      analysis,
    };
  }

  const validated = validateAssistantToolArgs(toolId, action.payload ?? {});
  const missingFields = action.missing_fields ?? [];
  const hasMissingFieldGap =
    action.status === "needs_input" ||
    missingFields.length > 0 ||
    (action.missing_field_items?.length ?? 0) > 0;

  if (hasMissingFieldGap) {
    return {
      kind: "need_input",
      fields: missingFields,
      actionId: action.id,
      analysis,
      queueProgress: getQueueProgress(analysis),
    };
  }

  if (!validated.ok) {
    if (pendingAfter > 0) {
      return {
        kind: "blocked",
        reason: "invalid",
        label,
        message: validated.message,
        analysis,
        canContinue: true,
        queueProgress: getQueueProgress(analysis),
      };
    }

    return { kind: "invalid", message: validated.message, analysis };
  }

  return {
    kind: "confirm",
    toolId,
    label: definition.label,
    args: validated.data,
    actionId: action.id,
    analysis,
    queueProgress: getQueueProgress(analysis),
  };
}

export function requiresAssistantConfirmation(
  analysis: AssistantAnalysis,
): boolean {
  const state = resolveAssistantAction(analysis);
  return state.kind === "confirm";
}
