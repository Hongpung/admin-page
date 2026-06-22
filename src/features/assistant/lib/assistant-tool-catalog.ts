import "server-only";

import {
  formatAssistantBannerFieldDocs,
  formatAssistantNoticeFieldDocs,
  formatAssistantScopePolicyForPrompt,
} from "@admin/features/assistant/constants/assistant-scope";
import { formatAssistantClubNamesForPrompt } from "@admin/features/assistant/constants/assistant-clubs";
import { getAssistantLookupToolDefinition } from "@admin/features/assistant/lib/assistant-lookup-tool-definitions";
import { SCHEDULE_CANONICAL_ACTION_PROMPT } from "@admin/features/assistant/constants/assistant-prompts/schedule";
import { ASSISTANT_API_TOOL_WORKFLOWS_PROMPT } from "@admin/features/assistant/constants/assistant-prompts/api-tool-guide";
import { getAssistantToolDefinition } from "@admin/features/assistant/lib/assistant-tool-definitions";
import {
  assistantLookupToolIdSchema,
  assistantToolIdSchema,
  type AssistantToolId,
} from "@admin/features/assistant/types/assistant-tool.types";

const MUTATION_TOOL_IDS = assistantToolIdSchema.options;
const LOOKUP_TOOL_IDS = assistantLookupToolIdSchema.options;

const MUTATION_PAYLOAD_HINTS: Record<AssistantToolId, string[]> = {
  reservation_batch_create: [
    "API: POST /admin/reservation/batch",
    "dayTimes: [{ day: 월|화|…, startTime, endTime }]",
    "duration: { startDate, endDate } (YYYY-MM-DD)",
    "batchReservationOption: REGULAR/COMMON → title, reservationType, creatorId",
    "batchReservationOption: EXTERNAL → title, reservationType, creatorName",
  ],
  reservation_force_create: [
    "API: POST /admin/reservation",
    "단건: title, date, startTime, endTime, reservationType",
    "REGULAR/COMMON → creatorId 필요",
    "EXTERNAL → externalCreatorName 필요",
  ],
  reservations_multi_create: [
    "API: POST /admin/reservation (순차)",
    "reservations: 단건 예약 객체 배열 (2건 이상)",
    "각 항목: title, date, startTime, endTime, reservationType",
    "REGULAR/COMMON → creatorId, EXTERNAL → externalCreatorName",
  ],
  reservation_force_delete: [
    "API: DELETE /admin/reservation/:reservationId",
    "reservationId: number (삭제할 예약 ID)",
  ],
  reservations_batch_delete: [
    "API: DELETE /admin/reservation/:id (순차)",
    "reservationIds: number[] (삭제할 예약 ID 목록, 1개 이상)",
    "반드시 reservations_by_*_lookup 결과에서 ID 수집 — 사용자에게 직접 묻지 마세요",
  ],
  reservation_force_update: [
    "API: PATCH /admin/reservation/:reservationId",
    "reservationId (필수)",
    "title, date, startTime, endTime, reservationType, participationAvailable, creatorId, externalCreatorName 중 변경할 필드만 patch",
    "수정 전 reservations_by_*_lookup으로 reservationId 확인",
  ],
  notice_create: [
    "API: POST /notice",
    "title, content (필수)",
    "noticeAll (선택): true면 등록 시 전체 회원에게 앱 알림(notification) 발송",
  ],
  notice_update: [
    "API: PATCH /notice/:noticeId",
    "noticeId (필수)",
    "title, content, noticeAll 중 변경할 필드만 patch",
    "noticeAll: true면 수정 시에도 전체 알림 발송 옵션",
  ],
  notice_delete: ["API: DELETE /notice/:noticeId", "noticeId: number"],
  banner_create: [
    "API: POST /banner",
    "owner, bannerImgUrl, startDate, endDate (필수)",
    "href (선택): 배너 클릭 시 이동할 링크 URL",
  ],
  banner_update: [
    "API: PATCH /banner/:bannerId",
    "bannerId (필수)",
    "owner, bannerImgUrl, startDate, endDate, href 중 변경할 필드만 patch",
    "href: 배너 클릭 시 연결되는 링크",
  ],
  banner_delete: ["API: DELETE /banner/:bannerId", "bannerId: number"],
};

const ACTION_TYPE_BY_TOOL: Record<AssistantToolId, string> = {
  reservation_batch_create: "RESERVATION_BATCH_CREATE",
  reservation_force_create: "CREATE_RESERVATION",
  reservations_multi_create: "CREATE_RESERVATIONS_MULTI",
  reservation_force_delete: "DELETE_RESERVATION",
  reservations_batch_delete: "DELETE_RESERVATIONS_BATCH",
  reservation_force_update: "UPDATE_RESERVATION",
  notice_create: "CREATE_NOTICE",
  notice_update: "UPDATE_NOTICE",
  notice_delete: "DELETE_NOTICE",
  banner_create: "CREATE_BANNER",
  banner_update: "UPDATE_BANNER",
  banner_delete: "DELETE_BANNER",
};

const LOOKUP_ARGS_HINTS: Record<(typeof LOOKUP_TOOL_IDS)[number], string> = {
  club_leaders_lookup:
    "args.clubName (선택): 예약 creatorId 매핑용.",
  reservations_by_date_lookup: "args.date (필수): YYYY-MM-DD — 예약 목록 조회 전용",
  reservations_by_term_lookup:
    "args.startDate, args.endDate (필수): YYYY-MM-DD — 기간 예약 조회 전용",
  reservations_by_week_lookup:
    "args.weekOffset (선택): 0=이번 주, 1=다음 주, -1=지난 주 — /reservation/term 호출",
  notices_list_lookup: "args 없음: 공지 목록·noticeId 조회",
  banners_list_lookup: "args 없음: 배너 목록·bannerId 조회",
  members_search_lookup:
    "args.username (선택), args.clubId (선택), args.role (선택), args.page/pageSize (선택): 회원 검색·memberId 조회",
};

export function formatAssistantMutationToolCatalog(): string {
  return MUTATION_TOOL_IDS.map((toolId) => {
    const definition = getAssistantToolDefinition(toolId);
    if (!definition) return "";

    const hints = MUTATION_PAYLOAD_HINTS[toolId];
    return [
      `### ${toolId}`,
      `- action.type: ${ACTION_TYPE_BY_TOOL[toolId]}`,
      `- API: ${definition.label} — ${definition.description}`,
      "- payload 필드 (이번 턴에서 확인된 것만 patch):",
      ...hints.map((hint) => `  - ${hint}`),
      "- 실행은 관리자 승인 후 BFF가 admin API를 호출합니다.",
    ].join("\n");
  }).join("\n\n");
}

export function formatAssistantLookupToolCatalog(): string {
  return LOOKUP_TOOL_IDS.map((toolId) => {
    const definition = getAssistantLookupToolDefinition(toolId);
    if (!definition) return "";

    return [
      `### ${toolId}`,
      `- ${definition.label}: ${definition.description}`,
      `- ${LOOKUP_ARGS_HINTS[toolId]}`,
      "- 서버 read-tool 루프에서 자동 실행됩니다. 이 JSON 단계에서는 호출하지 마세요.",
    ].join("\n");
  }).join("\n\n");
}

/**
 * 텍스트 2차 분석 user 프롬프트에 삽입하는 도구 카탈로그 블록.
 * `TEXT_CONTINUATION_SYSTEM_INSTRUCTION`과 함께 사용.
 */
export function formatAssistantToolCatalogForPrompt(): string {
  return [
    ASSISTANT_API_TOOL_WORKFLOWS_PROMPT,
    "",
    formatAssistantScopePolicyForPrompt(),
    "",
    "## 공지 필드 의미",
    formatAssistantNoticeFieldDocs(),
    "",
    "## 배너 필드 의미",
    formatAssistantBannerFieldDocs(),
    "",
    formatAssistantClubNamesForPrompt(),
    "",
    "## 실행 도구 (write → action.type, 관리자 승인 후 실행)",
    formatAssistantMutationToolCatalog(),
    "",
    "## 시간표 슬롯 → CREATE_RESERVATION",
    SCHEDULE_CANONICAL_ACTION_PROMPT,
    "",
    "## 조회 도구 (read, 서버 tool 루프에서 이미 실행됨)",
    formatAssistantLookupToolCatalog(),
  ].join("\n");
}

export type AssistantLookupResultEntry = {
  toolId: string;
  args: Record<string, unknown>;
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
};

export function formatAssistantLookupResults(
  results: AssistantLookupResultEntry[],
): string {
  if (results.length === 0) {
    return "(조회 도구 실행 결과 없음)";
  }

  return results
    .map((entry, index) => {
      const header = `${index + 1}. ${entry.toolId} ${entry.ok ? "성공" : "실패"}: ${entry.message}`;
      const data =
        entry.data && Object.keys(entry.data).length > 0
          ? JSON.stringify(entry.data, null, 2)
          : "";
      return data ? `${header}\n${data}` : header;
    })
    .join("\n\n");
}
