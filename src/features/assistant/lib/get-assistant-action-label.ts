import {
  getAssistantToolDefinition,
  resolveToolIdFromActionType,
} from "@admin/features/assistant/lib/assistant-tool-definitions";
import type { AssistantActionType } from "@admin/features/assistant/types/assistant-tool.types";

const FALLBACK_LABELS: Partial<Record<AssistantActionType, string>> = {
  RESERVATION_BATCH_CREATE: "정기 예약 일괄 생성",
  CREATE_RESERVATION: "예약 생성",
  CREATE_RESERVATIONS_MULTI: "예약 다건 생성",
  DELETE_RESERVATION: "예약 삭제",
  DELETE_RESERVATIONS_BATCH: "예약 일괄 삭제",
  UPDATE_RESERVATION: "예약 수정",
  CREATE_NOTICE: "공지 등록",
  UPDATE_NOTICE: "공지 수정",
  DELETE_NOTICE: "공지 삭제",
  CREATE_BANNER: "배너 등록",
  UPDATE_BANNER: "배너 수정",
  DELETE_BANNER: "배너 삭제",
  UNKNOWN: "알 수 없는 작업",
  NONE: "작업 없음",
};

export function getAssistantActionLabel(actionType: AssistantActionType): string {
  const toolId = resolveToolIdFromActionType(actionType);
  if (toolId) {
    const definition = getAssistantToolDefinition(toolId);
    if (definition) return definition.label;
  }

  return FALLBACK_LABELS[actionType] ?? actionType;
}
