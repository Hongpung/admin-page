import { ASSISTANT_LABELS } from "@admin/features/assistant/constants/assistant-labels";
import {
  assistantAnalysisSchema,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";

type PatchAssistantDraftStateArgs = {
  roomId: string;
  patch: Record<string, unknown>;
  analysis: AssistantAnalysis;
  actionId?: string;
};

export async function patchAssistantDraftState({
  roomId,
  patch,
  analysis,
  actionId,
}: PatchAssistantDraftStateArgs) {
  const response = await fetch("/api/assistant/draft-state", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      roomId,
      patch,
      analysis,
      ...(actionId ? { actionId } : {}),
    }),
  });

  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof (payload as { message: unknown }).message === "string"
        ? (payload as { message: string }).message
        : ASSISTANT_LABELS.inputSubmitFailed;
    throw new Error(message);
  }

  const parsed = assistantAnalysisSchema.safeParse(
    payload &&
      typeof payload === "object" &&
      "analysis" in payload &&
      (payload as { analysis: unknown }).analysis,
  );
  if (!parsed.success) {
    throw new Error(ASSISTANT_LABELS.inputSubmitFailed);
  }

  return parsed.data;
}
