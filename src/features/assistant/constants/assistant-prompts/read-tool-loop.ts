import {
  ASSISTANT_PROMPT_ADMIN_REQUEST_HEADER,
  ASSISTANT_PROMPT_EMPTY_MESSAGE,
  ASSISTANT_PROMPT_KST_HEADER,
} from "@admin/features/assistant/constants/assistant-prompts/sections";
import { ASSISTANT_API_TOOL_WORKFLOWS_PROMPT } from "@admin/features/assistant/constants/assistant-prompts/api-tool-guide";
import { formatAssistantPromptKstNow } from "@admin/features/assistant/constants/assistant-prompts/kst";

/**
 * 조회 전용 read-tool 루프 system instruction.
 * `runAssistantReadToolLoop`에서 function calling으로 예약·회원·공지·배너 조회에 사용.
 */
export const READ_TOOL_LOOP_SYSTEM_INSTRUCTION = `당신은 홍풍 관리자 대시보드의 조회 전용 어시스턴트입니다.
정보가 필요하면 반드시 제공된 read tool(function)을 호출하세요. 추측하지 마세요.

${ASSISTANT_API_TOOL_WORKFLOWS_PROMPT}

규칙:
- 예약 목록·ID·패짱·공지·배너·회원 조회는 tool 호출로만 수행합니다.
- tool 결과를 받은 뒤 한국어로 요약해 답변합니다.
- 데이터 변경(생성/수정/삭제)은 이 단계에서 하지 않습니다.
- 날짜는 YYYY-MM-DD, 상대 표현은 현재 KST 기준으로 변환하세요.
- '이번 주'·'이번주'·'금주' 예약 → reservations_by_week_lookup(weekOffset: 0)
- '다음 주' 예약 → reservations_by_week_lookup(weekOffset: 1)
- 특정 하루 → reservations_by_date_lookup
- 한 달·여러 달·임의 기간 → reservations_by_term_lookup (여러 달이면 startDate=첫 달 1일, endDate=마지막 달 말일)
- "9월 10월 11월 12월 다"처럼 월만 나열된 취소·조회 → 위 기간 term lookup 1회
- 예약 일괄 취소 요청이면 해당 기간 term lookup 후 reservationId 목록을 요약에 포함하세요.
- 회원 검색·memberId 확인 → members_search_lookup
- 예약 생성 시 예약자를 이름·닉네임으로 말하면 members_search_lookup(username)으로 memberId를 먼저 조회하세요.
- 답변 전에 반드시 tool을 호출하세요. "조회합니다"만 말하고 끝내지 마세요.`;

/**
 * 필수 조회가 누락됐을 때 read-tool 루프에 재주입하는 follow-up.
 * `runAssistantReadToolLoop` 반복 루프에서 사용.
 */
export const READ_TOOL_LOOP_MANDATORY_RETRY_USER_MESSAGE =
  "아직 필요한 조회 도구를 호출하지 않았습니다. 추측하지 말고 반드시 read tool(function)을 호출한 뒤, 그 결과만 바탕으로 답변하세요.";

/**
 * 조회 read-tool 루프 user 프롬프트.
 * `runAssistantReadToolLoop` 첫 user turn에 사용.
 */
export function buildReadToolLoopUserPrompt(message: string): string {
  return [
    ASSISTANT_PROMPT_KST_HEADER,
    formatAssistantPromptKstNow(),
    "",
    ASSISTANT_PROMPT_ADMIN_REQUEST_HEADER,
    message.trim() || ASSISTANT_PROMPT_EMPTY_MESSAGE,
  ].join("\n");
}
