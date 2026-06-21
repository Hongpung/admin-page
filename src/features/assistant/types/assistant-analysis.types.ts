import { z } from "zod";

export const assistantMissingFieldItemSchema = z.object({
  path: z.string(),
  label: z.string(),
  message: z.string(),
  display: z.string(),
});

export type AssistantMissingFieldItem = z.infer<
  typeof assistantMissingFieldItemSchema
>;

const TERMINAL_ACTION_STATUSES = new Set([
  "success",
  "error",
  "rejected",
  "completed",
  "cancelled",
]);

export const assistantActionSchema = z.object({
  id: z.string().optional(),
  type: z.enum([
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
    "UNKNOWN",
    "NONE",
  ]),
  payload: z.record(z.string(), z.unknown()).optional(),
  missing_fields: z.array(z.string()).optional(),
  missing_field_items: z.array(assistantMissingFieldItemSchema).optional(),
  status: z
    .enum([
      "pending",
      "needs_input",
      "ready",
      "confirming",
      "executing",
      "success",
      "error",
      "rejected",
      "completed",
      "cancelled",
    ])
    .optional(),
  error: z.string().optional(),
  attempts: z.number().int().nonnegative().optional(),
});

export type AssistantAction = z.infer<typeof assistantActionSchema>;

export const assistantAnalysisSchema = z.object({
  summary: z.string(),
  detected_text: z.string(),
  admin_action_required: z.boolean(),
  recommended_action: z.string(),
  confidence: z.number().min(0).max(1),
  fallback_required: z.boolean(),
  execution_briefing: z.string().optional(),
  action: assistantActionSchema.optional(),
  actions: z.array(assistantActionSchema).optional(),
  usage: z
    .object({
      dailyUsed: z.number(),
      dailyLimit: z.number(),
      monthlyUsed: z.number(),
      monthlyLimit: z.number(),
      period: z.enum(["month"]).optional(),
      resetAt: z.string().optional(),
    })
    .optional(),
});

export type AssistantAnalysis = z.infer<typeof assistantAnalysisSchema>;

export function normalizeAssistantActions(
  analysis: Pick<AssistantAnalysis, "action" | "actions">,
): AssistantAction[] {
  if (analysis.actions && analysis.actions.length > 0) {
    return analysis.actions;
  }
  return analysis.action ? [analysis.action] : [];
}

export function getCurrentAssistantAction(
  analysis: Pick<AssistantAnalysis, "action" | "actions">,
): AssistantAction | undefined {
  const actions = normalizeAssistantActions(analysis);
  return actions.find(
    (action) => !action.status || !TERMINAL_ACTION_STATUSES.has(action.status),
  );
}

export function hasPendingAssistantActions(
  analysis: Pick<AssistantAnalysis, "action" | "actions">,
): boolean {
  return getCurrentAssistantAction(analysis) !== undefined;
}

/** @deprecated use getCurrentAssistantAction */
export function getPrimaryAssistantAction(
  analysis: Pick<AssistantAnalysis, "action" | "actions">,
): AssistantAction | undefined {
  return getCurrentAssistantAction(analysis);
}

export function syncPrimaryAssistantAction(
  analysis: AssistantAnalysis,
): AssistantAnalysis {
  const actions =
    analysis.actions && analysis.actions.length > 0
      ? analysis.actions
      : analysis.action
        ? [analysis.action]
        : [];
  if (actions.length === 0) {
    return analysis;
  }

  const current = getCurrentAssistantAction({ actions });

  return {
    ...analysis,
    action: current,
    actions,
  };
}

/** AI 응답의 `~`(시간 범위 등)가 GFM 취소선으로 파싱되지 않도록 이스케이프 */
function escapeMarkdownTildes(text: string): string {
  return text.replace(/~/g, "\\~");
}

export function formatAssistantSummary(analysis: AssistantAnalysis): string {
  return escapeMarkdownTildes(analysis.summary.trim());
}

export function hasAssistantFollowUp(analysis: AssistantAnalysis): boolean {
  if (!analysis.admin_action_required) {
    return false;
  }

  const action = getCurrentAssistantAction(analysis);
  if (!action || action.type === "NONE") {
    return false;
  }

  return (
    analysis.recommended_action.trim().length > 0 ||
    (action.missing_fields?.length ?? 0) > 0
  );
}

export function hasAssistantDetails(analysis: AssistantAnalysis): boolean {
  return analysis.detected_text.trim().length > 0;
}

/** @deprecated Use formatAssistantSummary for visible reply text. */
export function formatAssistantReply(analysis: AssistantAnalysis): string {
  return formatAssistantSummary(analysis);
}
