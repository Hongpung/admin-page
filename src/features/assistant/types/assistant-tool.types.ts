import { z } from "zod";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";
import { assistantAnalysisSchema } from "@admin/features/assistant/types/assistant-analysis.types";
import { assistantRoomIdSchema } from "@admin/features/assistant/types/ai-api.types";

export const assistantToolIdSchema = z.enum([
  "reservation_batch_create",
  "reservation_force_create",
  "reservations_multi_create",
  "reservation_force_update",
  "reservation_force_delete",
  "reservations_batch_delete",
  "notice_create",
  "notice_update",
  "notice_delete",
  "banner_create",
  "banner_update",
  "banner_delete",
]);

export type AssistantToolId = z.infer<typeof assistantToolIdSchema>;

export const assistantLookupToolIdSchema = z.enum([
  "club_leaders_lookup",
  "reservations_by_date_lookup",
  "reservations_by_term_lookup",
  "reservations_by_week_lookup",
  "notices_list_lookup",
  "banners_list_lookup",
  "members_search_lookup",
]);

export type AssistantLookupToolId = z.infer<typeof assistantLookupToolIdSchema>;

export const assistantActionTypeSchema = z.enum([
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
]);

export type AssistantActionType = z.infer<typeof assistantActionTypeSchema>;

export const ACTION_TYPE_TO_TOOL: Partial<
  Record<AssistantActionType, AssistantToolId>
> = {
  RESERVATION_BATCH_CREATE: "reservation_batch_create",
  CREATE_RESERVATION: "reservation_force_create",
  CREATE_RESERVATIONS_MULTI: "reservations_multi_create",
  DELETE_RESERVATION: "reservation_force_delete",
  DELETE_RESERVATIONS_BATCH: "reservations_batch_delete",
  UPDATE_RESERVATION: "reservation_force_update",
  CREATE_NOTICE: "notice_create",
  UPDATE_NOTICE: "notice_update",
  DELETE_NOTICE: "notice_delete",
  CREATE_BANNER: "banner_create",
  UPDATE_BANNER: "banner_update",
  DELETE_BANNER: "banner_delete",
};

export const executeAssistantToolReqSchema = z.object({
  args: z.record(z.string(), z.unknown()),
  confirmed: z.literal(true, {
    message: "사용자 확인이 필요합니다.",
  }),
  roomId: assistantRoomIdSchema.optional(),
  actionId: z.string().optional(),
  analysis: assistantAnalysisSchema.optional(),
});

export type ExecuteAssistantToolReq = z.infer<
  typeof executeAssistantToolReqSchema
>;

export type AssistantActionConfirmState = {
  kind: "confirm";
  toolId: AssistantToolId;
  label: string;
  args: Record<string, unknown>;
  actionId?: string;
  analysis: AssistantAnalysis;
  queueProgress?: AssistantQueueProgress;
};

export type AssistantQueueProgress = {
  index: number;
  total: number;
  pending: number;
};

export type AssistantActionFailedState = {
  kind: "failed";
  label: string;
  message: string;
  actionId?: string;
  analysis: AssistantAnalysis;
  canContinue: boolean;
  queueProgress?: AssistantQueueProgress;
};

export type AssistantActionBlockedState = {
  kind: "blocked";
  reason: "unsupported" | "invalid";
  label: string;
  message: string;
  analysis: AssistantAnalysis;
  canContinue: boolean;
  queueProgress?: AssistantQueueProgress;
};

export type AssistantActionState =
  | { kind: "none" }
  | {
      kind: "need_input";
      fields: string[];
      actionId?: string;
      analysis: AssistantAnalysis;
      queueProgress?: AssistantQueueProgress;
    }
  | { kind: "manual"; analysis: AssistantAnalysis }
  | { kind: "invalid"; message: string; analysis: AssistantAnalysis }
  | AssistantActionConfirmState
  | AssistantActionFailedState
  | AssistantActionBlockedState;

export type AssistantToolExecutionResult = {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
};

export function isAssistantDeleteToolId(toolId: AssistantToolId): boolean {
  return (
    toolId === "reservation_force_delete" ||
    toolId === "reservations_batch_delete" ||
    toolId === "notice_delete" ||
    toolId === "banner_delete"
  );
}
