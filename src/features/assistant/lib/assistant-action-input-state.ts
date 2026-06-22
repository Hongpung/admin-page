import type { AssistantAction } from "@admin/features/assistant/types/assistant-analysis.types";

const CONCRETE_MUTATION_TYPES = new Set<AssistantAction["type"]>([
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
]);

export function isConcreteMutationAction(
  action: AssistantAction | undefined,
): boolean {
  return Boolean(action && CONCRETE_MUTATION_TYPES.has(action.type));
}

export function hasAssistantActionInputGap(
  action: AssistantAction | undefined,
): boolean {
  if (!action) return false;

  return (
    action.status === "needs_input" ||
    (action.missing_fields?.length ?? 0) > 0 ||
    (action.missing_field_items?.length ?? 0) > 0
  );
}
