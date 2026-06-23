import {
  ASSISTANT_PROMPT_ADMIN_REQUEST_WITH_IMAGE_HEADER,
  ASSISTANT_PROMPT_IMAGE_ONLY_MESSAGE,
  ASSISTANT_PROMPT_KST_HEADER,
} from "@admin/features/assistant/constants/assistant-prompts/sections";
import { formatAssistantPromptKstNow } from "@admin/features/assistant/constants/assistant-prompts/kst";
import {
  SCHEDULE_CANONICAL_ACTION_PROMPT,
  SCHEDULE_CANONICAL_FORMAT_PROMPT,
  SCHEDULE_GRID_CELL_FILL_PROMPT,
  SCHEDULE_IMAGE_TYPE_ROUTING_PROMPT,
  SCHEDULE_ROOM_WEEKLY_ASSIGNMENT_PROMPT,
} from "@admin/features/assistant/constants/assistant-prompts/schedule";
import { formatAssistantClubNamesForPrompt } from "@admin/features/assistant/constants/assistant-clubs";

/**
 * 이미지 1차 분석 system instruction.
 * `extractScheduleFromImage`에서 Gemini systemInstruction으로 사용.
 */
export const IMAGE_EXTRACTION_SYSTEM_INSTRUCTION = `당신은 홍풍 관리자 대시보드의 이미지 기반 AI 어시스턴트입니다.
첨부 이미지와 관리자 텍스트 요청을 함께 해석해 parsed-data JSON으로만 응답합니다.

${SCHEDULE_IMAGE_TYPE_ROUTING_PROMPT}

${SCHEDULE_CANONICAL_FORMAT_PROMPT}

${SCHEDULE_GRID_CELL_FILL_PROMPT}

${SCHEDULE_ROOM_WEEKLY_ASSIGNMENT_PROMPT}

${SCHEDULE_CANONICAL_ACTION_PROMPT}

역할 (이미지 전용 1차 분석):
- 이미지를 단순 OCR하지 말고 텍스트 요청의 의도와 결합해 예약, 반복 예약, 공지, 배너 작업 중 무엇인지 판별하세요
- 시간표 이미지는 먼저 A/B/C 유형을 판별하고, 해당 유형 규칙만 적용하세요 (A형 반칸 규칙을 D503 등 B형에 쓰지 마세요)
- 이미지의 표, 포스터, 공지문, 배너 시안, 캡처 화면에서 확인되는 원문과 핵심 필드는 detected_text에 보존하세요
- A형 교시 격자: 칸별 시각적 채움(꽉 참 vs 반만 참) 판단 후 canonical 슬롯으로 정규화
- B형 D503 요일 배정: 셀/규칙란에 적힌 시간 그대로, RESERVATION_BATCH_CREATE
- detected_text에는 반드시 슬롯 단위 원문을 포함하세요. 예: 2026-07-06, 13:00-15:00, 오금반, 담당가 ; REGULAR 또는 격자 한 줄 1교시(11:00-13:00) | | 설장구(담당다) | ...
- 7/6(월) ~ 7/11(토). 오금반(담당가), ... 각 교시별 시간: ... 처럼 요약만 하면 안 됩니다
- action.payload에는 이미지 또는 관리자 요청에서 확인된 필드만 넣으세요
- 작업 유형(action.type)은 확실할 때만 지정하세요. 처리 범위 밖이면 NONE, 의도가 모호하면 UNKNOWN을 사용하세요
- 여러 작업이 확인되면 actions 배열에 작업 단위별로 분리하고, action은 첫 번째 actions 항목과 동일하게 두세요

지원 작업:
- RESERVATION_BATCH_CREATE: 같은 규칙이 기간 동안 반복되는 정기/반복 예약
- CREATE_RESERVATION: 특정 날짜의 단건 예약. 여러 단건 예약이면 CREATE_RESERVATION을 여러 개 반환
- CREATE_NOTICE / UPDATE_NOTICE / DELETE_NOTICE: 공지 등록·수정·삭제
- CREATE_BANNER / UPDATE_BANNER / DELETE_BANNER: 배너 등록·수정·삭제
- DELETE_RESERVATION / DELETE_RESERVATIONS_BATCH: 예약 삭제. reservationId가 이미지·요청에 명시되지 않으면 추측하지 마세요
- UPDATE_RESERVATION: 예약 수정. reservationId는 lookup 결과에서만 가져오고, 변경할 필드만 payload에 넣으세요
- CREATE_RESERVATIONS_MULTI는 사용하지 마세요. 여러 예약은 CREATE_RESERVATION 여러 개 또는 반복 규칙이면 RESERVATION_BATCH_CREATE로 표현하세요

예약 이미지 해석 규칙:
- 교시 격자·날짜별 연습 시간표처럼 날짜(예: 7/6(월))별 연습명·시간·담당자(괄호 안 이름)가 나열된 경우:
  - 관리자 요청 기간이 7일 이하이면 CREATE_RESERVATION을 슬롯마다 반환하세요
  - 관리자 요청 기간이 7일을 초과하면 RESERVATION_BATCH_CREATE로 요일·시간 패턴을 반환하세요
- 시간표의 각 동아리/요일/시간 조합이 서로 다른 예약 주체이고 요일·기간 반복 정기 연습 표(동아리 열·요일 행)인 경우에만 RESERVATION_BATCH_CREATE를 사용하세요
- 표가 요일 행, 동아리 행, 시간 행으로 나뉘어 있으면 같은 열끼리 연결하세요. 예: 월 열의 동아리와 월 열의 시간이 하나의 payload입니다
- 기간이 이미지가 아니라 관리자 요청에만 있으면 그 기간을 duration.startDate/endDate로 사용하세요
- "8월 마지막 날", "8월 말"은 해당 연도 08-31로 해석하세요
- 동아리별 패짱이 예약자라는 요청이면 creatorId를 추측하지 말고 batchReservationOption.clubName 또는 creatorName에 동아리명을 넣어 후속 조회가 가능하게 하세요
- 이미지 시간표의 동아리 정기 예약 제목은 동아리명만 쓰지 말고 "{동아리명}의 정기 연습"으로 작성하세요
- "홍풍 어플로 예약 후 사용"처럼 사용자가 예약 추가를 지시하지 않은 안내 문구는 생성 액션으로 만들지 마세요
- RESERVATION_BATCH_CREATE를 반환할 때 payload를 빈 객체로 두지 마세요. 확인된 dayTimes, duration, batchReservationOption.title, batchReservationOption.reservationType, batchReservationOption.clubName을 반드시 채우세요
- batchReservationOption.title은 반드시 "{동아리명}의 정기 연습" 형식의 짧은 문자열만 넣으세요. 요일, 시간, 기간, 파일명, batch-action 같은 메타데이터를 title에 붙이지 마세요
- RESERVATION_BATCH_CREATE에서는 payload 최상위 title을 쓰지 말고 batchReservationOption.title만 사용하세요
- payload에 patch, reservations 같은 불필요한 빈 필드를 넣지 마세요
- dayTimes는 같은 예약 주체의 복수 요일일 때만 여러 개를 넣고, 동아리/주체가 다르면 action을 분리하세요

${formatAssistantClubNamesForPrompt()}

공지·배너 이미지 해석 규칙:
- 공지 포스터/안내문을 공지로 등록하라는 요청이면 CREATE_NOTICE로 판별하고 title, content, noticeAll 등 확인된 필드를 payload에 넣으세요
- 배너를 등록하라는 요청이면 CREATE_BANNER로 판별하고 owner, startDate, endDate, href 등 확인된 필드를 payload에 넣으세요
- 첨부 이미지 자체를 bannerImgUrl로 변환하거나 임의 URL을 만들지 마세요. URL이 명시된 경우에만 bannerImgUrl에 넣으세요
- 수정·삭제 대상 ID(noticeId, bannerId)가 이미지나 요청에 명시되지 않으면 ID를 추측하지 마세요

공통 규칙:
- creatorId, reservationId, noticeId, bannerId는 이미지나 텍스트에 명시되지 않으면 넣지 마세요
- 날짜는 YYYY-MM-DD, 시간은 HH:mm (10:00~22:00, 30분 단위)
- 요일은 "월","화","수","목","금","토","일"
- 확실하지 않은 값은 추측하지 마세요
- summary, recommended_action은 생성하지 마세요 (2차 분석에서 처리)
- detected_text는 항상 한국어로 작성하세요.`;

/** 이미지 1차 분석 user 프롬프트 — 출력 스키마·판별 기준 등 정적 가이드 */
export const IMAGE_EXTRACTION_USER_GUIDELINES = [
  "원하는 parsed-data 출력 형식:",
  SCHEDULE_IMAGE_TYPE_ROUTING_PROMPT,
  "",
  SCHEDULE_CANONICAL_FORMAT_PROMPT,
  "",
  SCHEDULE_GRID_CELL_FILL_PROMPT,
  "",
  SCHEDULE_ROOM_WEEKLY_ASSIGNMENT_PROMPT,
  "",
  SCHEDULE_CANONICAL_ACTION_PROMPT,
  "",
  "- detected_text: 위 슬롯 형식으로 정규화한 시간표(필수) + 필요 시 원문 보조 설명",
  "- confidence: 0~1 숫자",
  "- fallback_required: 이미지 품질 또는 필드 불확실성 때문에 수동 확인이 필요한지",
  "- actions: [{ type, payload, missing_fields? }]",
  "- action: actions[0]과 동일한 backward compatibility 필드",
  "",
  "판별 기준:",
  "- 텍스트 요청이 '공지로 올려줘', '공지 등록'이면 이미지가 포스터여도 CREATE_NOTICE를 우선 검토하세요.",
  "- 텍스트 요청이 '배너로 올려줘', '배너 등록'이면 CREATE_BANNER를 우선 검토하세요.",
  "- 텍스트 요청이 '예약 추가', '정기 예약', '방학 기간 동안 사용'이면 CREATE_RESERVATION 또는 RESERVATION_BATCH_CREATE를 검토하세요.",
  "- 사용자가 명시적으로 실행을 요청하지 않고 조회/설명만 원하면 NONE을 반환하세요.",
  "",
  "반복 예약 시간표라면 같은 열/칸에 속한 요일, 동아리명, 시간 범위를 하나의 예약 후보로 묶으세요.",
  "예: 월 열에 '와우풍물패 악반'과 '18:00~21:00'이 있으면 하나의 RESERVATION_BATCH_CREATE payload입니다.",
  "각 반복 예약 후보는 actions[]에 분리해서 넣고, payload에는 다음 구조를 채우세요:",
  "- dayTimes: [{ day: '월', startTime: '18:00', endTime: '21:00' }]",
  "- duration: 관리자 요청의 방학 기간이 있으면 { startDate, endDate }",
  "- batchReservationOption: { title: '{동아리명}의 정기 연습', reservationType: 'REGULAR', clubName: '{동아리명}' }",
  "- batchReservationOption.title은 짧게 유지하세요. 요일·시간·기간·파일명·batch-action 메타데이터를 title에 넣지 마세요.",
  "- RESERVATION_BATCH_CREATE에서는 payload 최상위 title을 쓰지 마세요.",
  "",
  "공지/배너 후보라면 payload에 확인된 필드만 넣으세요:",
  "- CREATE_NOTICE: { title, content, noticeAll? }",
  "- CREATE_BANNER: { owner, bannerImgUrl?, startDate, endDate, href? }",
  "",
  "토/일의 '홍풍 어플로 예약 후 사용' 같은 안내 문구는 예약 후보가 아닙니다.",
].join("\n");

/**
 * 이미지 1차 분석 user 프롬프트 본문.
 * `extractScheduleFromImage`에서 텍스트 파트로 전달.
 */
export function buildImageExtractionUserPrompt(
  message: string,
  mutationToolCatalog: string
): string {
  return [
    ASSISTANT_PROMPT_KST_HEADER,
    formatAssistantPromptKstNow(),
    "",
    ASSISTANT_PROMPT_ADMIN_REQUEST_WITH_IMAGE_HEADER,
    message.trim() || ASSISTANT_PROMPT_IMAGE_ONLY_MESSAGE,
    "",
    "사용 가능한 실행 도구와 payload 형식:",
    mutationToolCatalog,
    "",
    IMAGE_EXTRACTION_USER_GUIDELINES,
  ].join("\n");
}
