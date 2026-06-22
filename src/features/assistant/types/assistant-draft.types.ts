import type { AssistantActionType } from "@admin/features/assistant/types/assistant-tool.types";
import type { AssistantMissingFieldItem } from "@admin/features/assistant/types/assistant-analysis.types";

export type AssistantDraftPayload = Record<string, unknown>;

export type QueuedAssistantActionStatus =
  | "pending"
  | "needs_input"
  | "ready"
  | "confirming"
  | "executing"
  | "completed"
  | "failed"
  | "cancelled";

/** 액션 1건 payload 정규화 중에만 유지. ready/failed/cancelled 시 삭제 */
export type ActionResolutionToolResult = {
  callId: string;
  toolId: string;
  args: Record<string, unknown>;
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
};

export type ActionResolutionSession = {
  userMessage: string;
  detectedText: string;
  toolResults: ActionResolutionToolResult[];
  llmTurns: number;
  startedAt: string;
};

export type QueuedAssistantAction = {
  id: string;
  type: Exclude<AssistantActionType, "UNKNOWN" | "NONE">;
  payload: AssistantDraftPayload;
  status: QueuedAssistantActionStatus;
  missingFields: string[];
  missingFieldItems: AssistantMissingFieldItem[];
  error?: string;
  attempts: number;
  /** 예약 가능 범위 밖 값을 자동 보정한 내역 */
  adjustmentNotes?: string[];
  /** payload 정규화 루프 동안만 존재. 완료·실패·취소 시 제거 */
  resolutionSession?: ActionResolutionSession;
};

export type AssistantDraft = {
  queue: QueuedAssistantAction[];
  revision: number;
  updatedAt: string;
};

export type AssistantQueueProgress = {
  index: number;
  total: number;
  pending: number;
};

export type AssistantDraftSnapshot = {
  draft: AssistantDraft | null;
  currentAction: QueuedAssistantAction | null;
  missingFields: string[];
  missingFieldItems: AssistantMissingFieldItem[];
  ready: boolean;
  queueProgress: AssistantQueueProgress | null;
};

export type AssistantDraftKey = {
  adminId: string;
  roomId: string;
};

/** @deprecated queue의 current action에서 파생 */
export function getLegacyDraftActionType(
  draft: AssistantDraft | null,
): Exclude<AssistantActionType, "UNKNOWN" | "NONE"> | null {
  const current = draft?.queue.find((item) => !isTerminalQueueStatus(item.status));
  return current?.type ?? null;
}

/** @deprecated queue의 current action에서 파생 */
export function getLegacyDraftPayload(
  draft: AssistantDraft | null,
): AssistantDraftPayload {
  const current = draft?.queue.find((item) => !isTerminalQueueStatus(item.status));
  return current?.payload ?? {};
}

export function isTerminalQueueStatus(status: QueuedAssistantActionStatus): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}
