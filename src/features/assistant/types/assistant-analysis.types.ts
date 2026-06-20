import { z } from "zod";

export const assistantAnalysisSchema = z.object({
  summary: z.string(),
  detected_text: z.string(),
  admin_action_required: z.boolean(),
  recommended_action: z.string(),
  confidence: z.number().min(0).max(1),
  fallback_required: z.boolean(),
  action: z
    .object({
      type: z.enum([
        "RESERVATION_BATCH_CREATE",
        "CREATE_RESERVATION",
        "UNKNOWN",
        "NONE",
      ]),
      payload: z.record(z.string(), z.unknown()).optional(),
      missing_fields: z.array(z.string()).optional(),
    })
    .optional(),
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

/** AI 응답의 `~`(시간 범위 등)가 GFM 취소선으로 파싱되지 않도록 이스케이프 */
function escapeMarkdownTildes(text: string): string {
  return text.replace(/~/g, "\\~");
}

export function formatAssistantSummary(analysis: AssistantAnalysis): string {
  return escapeMarkdownTildes(analysis.summary.trim());
}

export function hasAssistantDetails(analysis: AssistantAnalysis): boolean {
  return (
    analysis.detected_text.trim().length > 0 ||
    analysis.recommended_action.trim().length > 0 ||
    (analysis.action?.missing_fields?.length ?? 0) > 0
  );
}

/** @deprecated Use formatAssistantSummary for visible reply text. */
export function formatAssistantReply(analysis: AssistantAnalysis): string {
  return formatAssistantSummary(analysis);
}
