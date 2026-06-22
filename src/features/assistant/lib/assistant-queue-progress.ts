import {
  normalizeAssistantActions,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";

const TERMINAL_ACTION_STATUSES = new Set([
  "success",
  "error",
  "rejected",
  "completed",
  "cancelled",
]);

function isActiveActionStatus(status: string | undefined): boolean {
  return !status || !TERMINAL_ACTION_STATUSES.has(status);
}

export function getPendingActionsAfterCurrent(
  analysis: AssistantAnalysis,
): number {
  const actions = normalizeAssistantActions(analysis);
  const currentIndex = actions.findIndex((action) =>
    isActiveActionStatus(action.status),
  );

  if (currentIndex === -1) {
    return 0;
  }

  return actions
    .slice(currentIndex + 1)
    .filter((action) => isActiveActionStatus(action.status)).length;
}

export function getTerminalActionsForHistory(
  analysis: AssistantAnalysis,
) {
  const actions = normalizeAssistantActions(analysis);
  const currentIndex = actions.findIndex((action) =>
    isActiveActionStatus(action.status),
  );

  return actions.filter((action, index) => {
    if (currentIndex !== -1 && index >= currentIndex) {
      return false;
    }
    return action.status && TERMINAL_ACTION_STATUSES.has(action.status);
  });
}
