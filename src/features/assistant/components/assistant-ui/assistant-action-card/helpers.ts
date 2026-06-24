import { ASSISTANT_LABELS } from "@admin/features/assistant/constants/assistant-labels";
import type { AssistantToolDiscardImpactItem } from "@admin/features/assistant/lib/collect-tool-discard-impact";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";
import type {
  AssistantActionConfirmState,
  AssistantToolExecutionResult,
} from "@admin/features/assistant/types/assistant-tool.types";

export type ActionCardStatus =
  | "pending"
  | "executing"
  | "success"
  | "error"
  | "rejected";

export type ImpactStatus = "loading" | "ready" | "error";

type ExecuteToolResponse = AssistantToolExecutionResult & {
  analysis?: AssistantAnalysis;
  briefing?: string;
  queueComplete?: boolean;
  queueProgress?: { index: number; total: number; pending: number };
};

export function isAssistantAnalysis(value: unknown): value is AssistantAnalysis {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.summary === "string" &&
    typeof candidate.detected_text === "string" &&
    typeof candidate.recommended_action === "string"
  );
}

export async function fetchDiscardImpact(
  state: AssistantActionConfirmState,
  signal?: AbortSignal,
): Promise<AssistantToolDiscardImpactItem[]> {
  const response = await fetch(`/api/assistant/tools/${state.toolId}/impact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal,
    body: JSON.stringify({ args: state.args }),
  });

  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof (payload as { message: unknown }).message === "string"
        ? (payload as { message: string }).message
        : ASSISTANT_LABELS.actionImpactLoadFailed;
    throw new Error(message);
  }

  if (
    payload &&
    typeof payload === "object" &&
    "discarded" in payload &&
    Array.isArray((payload as { discarded: unknown }).discarded)
  ) {
    return (payload as { discarded: AssistantToolDiscardImpactItem[] }).discarded;
  }

  return [];
}

export async function executeConfirmedTool(
  state: AssistantActionConfirmState,
  roomId: string | null,
  signal?: AbortSignal,
): Promise<ExecuteToolResponse> {
  const response = await fetch(`/api/assistant/tools/${state.toolId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal,
    body: JSON.stringify({
      args: state.args,
      confirmed: true,
      ...(roomId ? { roomId } : {}),
      ...(state.actionId ? { actionId: state.actionId } : {}),
      analysis: state.analysis,
    }),
  });

  const payload: unknown = await response.json().catch(() => ({}));
  const message =
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message: unknown }).message === "string"
      ? (payload as { message: string }).message
      : response.ok
        ? "요청이 처리되었습니다."
        : "도구 실행에 실패했습니다.";

  const analysis =
    payload &&
    typeof payload === "object" &&
    "analysis" in payload &&
    isAssistantAnalysis((payload as { analysis: unknown }).analysis)
      ? (payload as { analysis: AssistantAnalysis }).analysis
      : undefined;

  const queueComplete = Boolean(
    payload &&
      typeof payload === "object" &&
      "queueComplete" in payload &&
      (payload as { queueComplete: unknown }).queueComplete === true,
  );
  const briefing =
    payload &&
    typeof payload === "object" &&
    "briefing" in payload &&
    typeof (payload as { briefing: unknown }).briefing === "string"
      ? (payload as { briefing: string }).briefing
      : undefined;

  if (!response.ok) {
    return { ok: false, message, analysis, briefing, queueComplete };
  }

  return {
    ok: true,
    message,
    data:
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : undefined,
    analysis,
    briefing,
    queueComplete,
  };
}

export async function cancelCurrentDraftAction(
  roomId: string | null,
  analysis: AssistantAnalysis,
): Promise<AssistantAnalysis | null> {
  if (!roomId) return null;

  const response = await fetch("/api/assistant/draft-state", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      roomId,
      cancelCurrent: true,
      analysis,
    }),
  });

  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) return null;

  const nextAnalysis =
    payload &&
    typeof payload === "object" &&
    "analysis" in payload &&
    isAssistantAnalysis((payload as { analysis: unknown }).analysis)
      ? (payload as { analysis: AssistantAnalysis }).analysis
      : null;

  return nextAnalysis;
}
