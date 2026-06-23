/** 사용자 프롬프트에 KST 현재 시각을 붙일 때 쓰는 섹션 제목 */
export const ASSISTANT_PROMPT_KST_HEADER = "현재 날짜/시간(KST):";

/** 텍스트·이미지 분석 공통 — 관리자가 입력한 요청 본문 섹션 */
export const ASSISTANT_PROMPT_ADMIN_REQUEST_HEADER = "관리자 요청:";

/** 이미지 1차 분석 user 프롬프트 — 텍스트는 보조 힌트임을 명시 */
export const ASSISTANT_PROMPT_ADMIN_REQUEST_WITH_IMAGE_HEADER =
  "관리자 요청 (텍스트 프롬프트, 이미지와 함께 판단):";

/** 관리자 텍스트가 비었을 때 placeholder */
export const ASSISTANT_PROMPT_EMPTY_MESSAGE = "(텍스트 없음)";

/** 이미지 위주 분석 시 placeholder */
export const ASSISTANT_PROMPT_IMAGE_ONLY_MESSAGE =
  "(텍스트 없음, 이미지 분석 위주)";

/** 액션 payload 정규화 user 프롬프트 섹션 */
export const ASSISTANT_PROMPT_DETECTED_TEXT_HEADER = "인식 텍스트(이미지 등):";

export const ASSISTANT_PROMPT_RESOLUTION_ACTION_HEADER =
  "정규화 대상 액션(JSON):";

export const ASSISTANT_PROMPT_RESOLUTION_TOOL_RESULTS_HEADER =
  "이번 액션에서 이미 실행한 조회 결과:";

/** 이미지 기반 2차 텍스트 분석용 — 1차 OCR/구조화 결과 */
export const ASSISTANT_PROMPT_IMAGE_EXTRACTION_HEADER = "첨부 이미지 해석 결과:";

export const ASSISTANT_PROMPT_IMAGE_STRUCTURED_CANDIDATE_HEADER =
  "첨부 이미지 구조화 후보(JSON):";

/** 텍스트 2차 분석 user 프롬프트 섹션 */
export const ASSISTANT_PROMPT_TOOL_CATALOG_HEADER = "사용 가능한 도구 카탈로그:";

export const ASSISTANT_PROMPT_READ_TOOL_RESULTS_HEADER = "read-tool 실행 결과:";

export const ASSISTANT_PROMPT_READ_LOOP_TEXT_HEADER =
  "read-tool 루프 자연어 응답:";

export const ASSISTANT_PROMPT_DRAFT_STATE_HEADER =
  "현재 BFF draft 상태(JSON):";

export const ASSISTANT_PROMPT_IMAGE_EXTRACTION_JSON_HEADER =
  "1차 이미지 분석 결과(JSON):";

export const ASSISTANT_PROMPT_MISSING_FIELDS_HEADER =
  "서버가 계산한 부족한 필드:";

export const ASSISTANT_PROMPT_CONTEXT_HEADER = "컨텍스트:";
