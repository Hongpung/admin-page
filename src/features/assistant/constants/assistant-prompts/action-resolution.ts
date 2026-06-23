import {
  ASSISTANT_PROMPT_ADMIN_REQUEST_HEADER,
  ASSISTANT_PROMPT_DETECTED_TEXT_HEADER,
  ASSISTANT_PROMPT_KST_HEADER,
  ASSISTANT_PROMPT_RESOLUTION_ACTION_HEADER,
  ASSISTANT_PROMPT_RESOLUTION_TOOL_RESULTS_HEADER,
} from "@admin/features/assistant/constants/assistant-prompts/sections";
import { formatAssistantPromptKstNow } from "@admin/features/assistant/constants/assistant-prompts/kst";
import { SCHEDULE_CANONICAL_ACTION_PROMPT } from "@admin/features/assistant/constants/assistant-prompts/schedule";
import { formatAssistantClubNamesForPrompt } from "@admin/features/assistant/constants/assistant-clubs";

const ACTION_RESOLUTION_CREATE_RESERVATION_RULES =
  SCHEDULE_CANONICAL_ACTION_PROMPT.split("\n")
    .map((line) => (line ? `  ${line}` : ""))
    .join("\n");

const ACTION_RESOLUTION_BASE_SYSTEM_INSTRUCTION = `당신은 홍풍 관리자 어시스턴트의 액션 payload 정규화기입니다.
지금은 큐에 있는 작업 1건만 완성합니다. 다른 작업은 무시하세요.

흐름:
1. 필요하면 read tool(function)을 호출해 memberId 등을 확인합니다.
2. tool 결과를 받은 뒤, 이번 작업에 필요한 조회가 끝났으면 최종 JSON payload를 반환합니다.
3. 추측하지 마세요. tool로 확인되지 않은 creatorId는 넣지 마세요. 관리자에게는 creatorName(예약자 이름)만 요청하세요.

CREATE_RESERVATION 규칙:
- detected_text 슬롯 한 줄(YYYY-MM-DD, HH:mm-HH:mm, title, creator ; KIND)이 있으면 아래 매핑을 따르세요:
${ACTION_RESOLUTION_CREATE_RESERVATION_RULES}
- 관리자 요청에 "표기된 이름으로 멤버 검색"이 있으면, 시간표 괄호 안 첫 번째 이름으로 members_search_lookup을 호출하세요.
- 검색 결과가 정확히 1명이면 creatorId를 채우세요. REGULAR/COMMON은 슬롯 KIND와 detected_text를 우선 따르세요.
- 검색 결과가 0건이면 EXTERNAL + externalCreatorName으로 처리하세요.
- 검색 결과가 있지만 정확히 일치하지 않으면 needs_human으로 후보 이름을 제시하고 관리자에게 정확한 예약자 이름(creatorName) 확인을 요청하세요. EXTERNAL로 바로 바꾸지 마세요.
- title, date, startTime, endTime은 관리자 요청·인식 텍스트·현재 payload 초안을 종합해 채우세요.
- 부분 patch만 반환하지 말고 schema 필수 필드를 모두 채운 완전한 payload만 ready로 반환하세요.

${formatAssistantClubNamesForPrompt()}

최종 응답(JSON, tool 호출 없이):
- status: "ready" | "needs_human" | "failed"
- payload: 완전한 객체 (ready일 때 필수)
- message: needs_human/failed 시 한국어 설명`;

/**
 * 큐 액션 payload 정규화 system instruction.
 * `resolveQueuedActionPayload`에서 액션 타입별로 사용.
 */
export function buildActionResolutionSystemInstruction(
  actionType: string,
): string {
  if (actionType === "CREATE_RESERVATION") {
    return ACTION_RESOLUTION_BASE_SYSTEM_INSTRUCTION;
  }

  return `${ACTION_RESOLUTION_BASE_SYSTEM_INSTRUCTION}

현재 액션 타입 ${actionType}은 조회 도구로 보완한 뒤 payload 필수 필드를 채우세요.`;
}

/** structured JSON 최종 응답 직전 follow-up */
export const ACTION_RESOLUTION_FINAL_JSON_USER_MESSAGE =
  "조회가 충분하면 tool 호출 없이 최종 JSON만 반환하세요. status는 ready | needs_human | failed 중 하나입니다.";

/** JSON 파싱 실패 시 재시도 follow-up */
export const ACTION_RESOLUTION_INVALID_JSON_USER_MESSAGE =
  "응답 JSON이 올바르지 않습니다. CREATE_RESERVATION schema를 만족하는 payload와 status를 다시 반환하세요.";

/** ready인데 payload가 불완전할 때 재시도 follow-up */
export const ACTION_RESOLUTION_INCOMPLETE_PAYLOAD_USER_MESSAGE =
  "ready이면 완전한 payload가 필요합니다. 부족한 필드는 tool로 확인하거나 needs_human으로 반환하세요.";

type BuildActionResolutionUserPromptArgs = {
  userMessage: string;
  detectedText: string;
  action: {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    missingFields?: string[];
  };
  toolResults: Array<{
    toolId: string;
    args: Record<string, unknown>;
    ok: boolean;
    message: string;
    data?: Record<string, unknown>;
  }>;
};

/**
 * 큐 액션 payload 정규화 user 프롬프트.
 * `resolveQueuedActionPayload` 첫 user turn 및 tool 결과 반영에 사용.
 */
export function buildActionResolutionUserPrompt(
  args: BuildActionResolutionUserPromptArgs,
): string {
  const sections = [
    ASSISTANT_PROMPT_KST_HEADER,
    formatAssistantPromptKstNow(),
    "",
    ASSISTANT_PROMPT_ADMIN_REQUEST_HEADER,
    args.userMessage.trim() || "(없음)",
    "",
    ASSISTANT_PROMPT_DETECTED_TEXT_HEADER,
    args.detectedText.trim() || "(없음)",
    "",
    ASSISTANT_PROMPT_RESOLUTION_ACTION_HEADER,
    JSON.stringify(
      {
        id: args.action.id,
        type: args.action.type,
        payload: args.action.payload,
        missingFields: args.action.missingFields,
      },
      null,
      2,
    ),
  ];

  if (args.toolResults.length > 0) {
    sections.push(
      "",
      ASSISTANT_PROMPT_RESOLUTION_TOOL_RESULTS_HEADER,
      JSON.stringify(
        args.toolResults.map(({ toolId, args: toolArgs, ok, message, data }) => ({
          toolId,
          args: toolArgs,
          ok,
          message,
          data,
        })),
        null,
        2,
      ),
    );
  }

  return sections.join("\n");
}
