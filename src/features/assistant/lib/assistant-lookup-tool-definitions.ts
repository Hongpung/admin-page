import { z } from "zod";
import {
  membersSearchLookupArgsSchema,
  reservationsByDateLookupArgsSchema,
  reservationsByTermLookupArgsSchema,
  reservationsByWeekLookupArgsSchema,
} from "@admin/features/assistant/types/schemas/assistant-delete-tool.schema";
import {
  assistantLookupToolIdSchema,
  type AssistantLookupToolId,
} from "@admin/features/assistant/types/assistant-tool.types";

export type AssistantLookupToolDefinition = {
  id: AssistantLookupToolId;
  label: string;
  description: string;
  argsSchema: z.ZodType<Record<string, unknown>>;
};

const LOOKUP_TOOL_DEFINITIONS = {
  club_leaders_lookup: {
    id: "club_leaders_lookup",
    label: "동아리 패짱 조회",
    description:
      "각 동아리의 패짱(정기 연습 예약 creator) memberId를 조회합니다.",
    argsSchema: z.object({
      clubName: z.string().trim().min(1).optional(),
    }),
  },
  reservations_by_date_lookup: {
    id: "reservations_by_date_lookup",
    label: "일별 예약 조회",
    description:
      "특정 날짜(YYYY-MM-DD)의 예약 목록과 reservationId를 조회합니다.",
    argsSchema: reservationsByDateLookupArgsSchema,
  },
  reservations_by_term_lookup: {
    id: "reservations_by_term_lookup",
    label: "기간별 예약 조회",
    description:
      "시작일~종료일 사이 예약 목록과 reservationId를 조회합니다.",
    argsSchema: reservationsByTermLookupArgsSchema,
  },
  reservations_by_week_lookup: {
    id: "reservations_by_week_lookup",
    label: "주간 예약 조회",
    description:
      "이번 주·다음 주 등 주 단위(월~일) 예약 목록을 조회합니다. weekOffset 0=이번 주, 1=다음 주, -1=지난 주.",
    argsSchema: reservationsByWeekLookupArgsSchema,
  },
  notices_list_lookup: {
    id: "notices_list_lookup",
    label: "공지 목록 조회",
    description: "등록된 공지 목록과 noticeId를 조회합니다.",
    argsSchema: z.object({}),
  },
  banners_list_lookup: {
    id: "banners_list_lookup",
    label: "배너 목록 조회",
    description: "등록된 배너 목록과 bannerId를 조회합니다.",
    argsSchema: z.object({}),
  },
  members_search_lookup: {
    id: "members_search_lookup",
    label: "회원 검색",
    description:
      "이름·동아리·역할 조건으로 회원을 검색하고 memberId를 조회합니다.",
    argsSchema: membersSearchLookupArgsSchema,
  },
} as const satisfies Record<AssistantLookupToolId, AssistantLookupToolDefinition>;

export function getAssistantLookupToolDefinition(
  toolId: string,
): AssistantLookupToolDefinition | null {
  const parsed = assistantLookupToolIdSchema.safeParse(toolId);
  if (!parsed.success) return null;
  return LOOKUP_TOOL_DEFINITIONS[parsed.data];
}

export function validateAssistantLookupToolArgs(
  toolId: AssistantLookupToolId,
  args: unknown,
):
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string } {
  const definition = LOOKUP_TOOL_DEFINITIONS[toolId];
  const parsed = definition.argsSchema.safeParse(args ?? {});
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "조회 도구 인자 형식이 올바르지 않습니다.";
    return { ok: false, message };
  }

  return { ok: true, data: parsed.data as Record<string, unknown> };
}
