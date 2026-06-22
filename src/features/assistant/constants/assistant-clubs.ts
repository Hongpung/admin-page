/** 홍풍 등록 동아리 짧은 명칭 (club-profiles·패짱 조회 매칭 기준) */
export const ASSISTANT_CLUB_NAMES = [
  "악반",
  "들녘",
  "산틀",
  "신명화랑",
] as const;

export type AssistantClubName = (typeof ASSISTANT_CLUB_NAMES)[number];

/**
 * LLM 프롬프트용 동아리 명칭·매칭 규칙 블록.
 * `formatAssistantToolCatalogForPrompt`, 이미지/텍스트 분석 system instruction에서 사용.
 */
export function formatAssistantClubNamesForPrompt(): string {
  const clubList = ASSISTANT_CLUB_NAMES.map((name) => `- ${name}`).join("\n");

  return [
    "## 홍풍 동아리 명칭 (정규화)",
    "등록된 동아리는 아래 네 개뿐입니다. 예약·패짱 조회 시 이 이름 중 하나로 매칭하세요.",
    clubList,
    "",
    "매칭 규칙:",
    '- 텍스트·이미지에 "와우풍물패 악반", "컴퓨터공학과 학회 산틀", "국어교육과 학회 들녘", "신소재·화학공학과 학회 신명화랑"처럼 긴 학회명이 있어도, 끝에 붙은 키워드(악반/들녘/산틀/신명화랑)로 위 네 이름 중 하나를 판별하세요.',
    "- batchReservationOption.clubName, club_leaders_lookup의 clubName 인자에는 매칭된 짧은 명칭(악반·들녘·산틀·신명화랑)을 우선 넣으세요.",
    '- batchReservationOption.title은 "{짧은 동아리명}의 정기 연습" 형식을 유지하세요. (예: "악반의 정기 연습", "산틀의 정기 연습")',
    "- 네 이름 중 어디에도 해당하지 않으면 동아리명을 추측하지 말고 원문을 유지하거나 관리자 확인을 요청하세요.",
    '- "탈반" 등 위 목록에 없는 명칭은 등록 동아리가 아닙니다. 악반/들녘/산틀/신명화랑 중 포함 여부를 먼저 확인하세요.',
  ].join("\n");
}
