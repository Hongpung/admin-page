import {
  batchReservationDtoSchema,
  createReservationPayloadSchema,
} from "@admin/features/reservation/types/schemas";
import {
  bannerCreateArgsSchema,
  bannerDeleteArgsSchema,
  bannerUpdateArgsSchema,
  noticeCreateArgsSchema,
  noticeDeleteArgsSchema,
  noticeUpdateArgsSchema,
} from "@admin/features/assistant/types/schemas/assistant-notice-banner.schema";
import {
  reservationForceDeleteArgsSchema,
  reservationsBatchDeleteArgsSchema,
} from "@admin/features/assistant/types/schemas/assistant-delete-tool.schema";
import { reservationUpdateArgsSchema } from "@admin/features/assistant/types/schemas/assistant-update-reservation.schema";
import { reservationsMultiCreateArgsSchema } from "@admin/features/assistant/types/schemas/assistant-multi-reservation.schema";
import {
  ACTION_TYPE_TO_TOOL,
  assistantToolIdSchema,
  type AssistantToolId,
} from "@admin/features/assistant/types/assistant-tool.types";
import type { z } from "zod";

export type AssistantToolDefinition = {
  id: AssistantToolId;
  label: string;
  description: string;
  argsSchema: z.ZodType<Record<string, unknown>>;
};

const TOOL_DEFINITIONS = {
  reservation_batch_create: {
    id: "reservation_batch_create",
    label: "정기 예약 일괄 생성",
    description: "요일·시간·기간에 맞춰 정기 예약을 일괄 등록합니다.",
    argsSchema: batchReservationDtoSchema,
  },
  reservation_force_create: {
    id: "reservation_force_create",
    label: "예약 강제 생성",
    description: "단건 예약을 관리자 권한으로 생성합니다.",
    argsSchema: createReservationPayloadSchema,
  },
  reservations_multi_create: {
    id: "reservations_multi_create",
    label: "예약 다건 생성",
    description: "여러 단건 예약을 관리자 권한으로 순차 생성합니다.",
    argsSchema: reservationsMultiCreateArgsSchema,
  },
  reservation_force_update: {
    id: "reservation_force_update",
    label: "예약 수정",
    description: "기존 예약을 관리자 권한으로 수정합니다.",
    argsSchema: reservationUpdateArgsSchema,
  },
  reservation_force_delete: {
    id: "reservation_force_delete",
    label: "예약 강제 삭제",
    description: "단건 예약을 관리자 권한으로 삭제합니다.",
    argsSchema: reservationForceDeleteArgsSchema,
  },
  reservations_batch_delete: {
    id: "reservations_batch_delete",
    label: "예약 일괄 삭제",
    description: "여러 예약 ID를 관리자 권한으로 일괄 삭제합니다.",
    argsSchema: reservationsBatchDeleteArgsSchema,
  },
  notice_create: {
    id: "notice_create",
    label: "공지 등록",
    description: "새 공지사항을 등록합니다.",
    argsSchema: noticeCreateArgsSchema,
  },
  notice_update: {
    id: "notice_update",
    label: "공지 수정",
    description: "기존 공지사항을 수정합니다.",
    argsSchema: noticeUpdateArgsSchema,
  },
  notice_delete: {
    id: "notice_delete",
    label: "공지 삭제",
    description: "공지사항을 삭제합니다.",
    argsSchema: noticeDeleteArgsSchema,
  },
  banner_create: {
    id: "banner_create",
    label: "배너 등록",
    description: "새 배너를 등록합니다.",
    argsSchema: bannerCreateArgsSchema,
  },
  banner_update: {
    id: "banner_update",
    label: "배너 수정",
    description: "기존 배너를 수정합니다.",
    argsSchema: bannerUpdateArgsSchema,
  },
  banner_delete: {
    id: "banner_delete",
    label: "배너 삭제",
    description: "배너를 삭제합니다.",
    argsSchema: bannerDeleteArgsSchema,
  },
} as const satisfies Record<AssistantToolId, AssistantToolDefinition>;

export function getAssistantToolDefinition(
  toolId: string,
): AssistantToolDefinition | null {
  const parsed = assistantToolIdSchema.safeParse(toolId);
  if (!parsed.success) return null;
  return TOOL_DEFINITIONS[parsed.data];
}

export function resolveToolIdFromActionType(
  actionType: string,
): AssistantToolId | null {
  const toolId =
    ACTION_TYPE_TO_TOOL[actionType as keyof typeof ACTION_TYPE_TO_TOOL];
  return toolId ?? null;
}

export function validateAssistantToolArgs(
  toolId: AssistantToolId,
  args: unknown,
):
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string } {
  const definition = TOOL_DEFINITIONS[toolId];
  const parsed = definition.argsSchema.safeParse(args);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "도구 인자 형식이 올바르지 않습니다.";
    return { ok: false, message };
  }

  return { ok: true, data: parsed.data as Record<string, unknown> };
}
