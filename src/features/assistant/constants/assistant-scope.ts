export const ASSISTANT_SCOPE_SUMMARY =
  "예약 관리(등록·수정·삭제), 공지 관리(등록·수정·삭제), 배너 관리(등록·수정·삭제)";

export const ASSISTANT_REFUSAL_MESSAGE =
  "현재 AI 어시스턴트는 예약·공지·배너 관리만 처리할 수 있습니다. 해당 요청은 관리 화면에서 직접 진행해주세요.";

export const ASSISTANT_OUT_OF_SCOPE_TOPICS = [
  "회원 권한·역할 변경",
  "관리자 권한 부여·변경·삭제",
  "가입 승인·거절",
  "동아리 프로필·패짱·역할 배정 변경",
  "세션 로그·통계 조회 등 기타 관리 기능",
] as const;

export const ASSISTANT_NOTICE_FIELD_DOCS = [
  "title: 공지 제목",
  "content: 공지 본문(텍스트)",
  "noticeAll: true이면 공지 등록·수정 시 전체 회원에게 앱 알림(notification)을 발송",
  "channel: (선택) 채널 ID. 보통 생략 가능",
  "noticeId: 수정·삭제 대상 공지 ID",
] as const;

export const ASSISTANT_BANNER_FIELD_DOCS = [
  "owner: 배너에 표시할 소유자/주체 이름(예: 동아리명, 행사명)",
  "bannerImgUrl: 배너 이미지 URL (S3 전체 URL 또는 스토리지 경로)",
  "startDate, endDate: 게시 기간 (YYYY-MM-DD)",
  "href: (선택) 사용자가 배너를 클릭했을 때 이동할 링크 URL",
  "bannerId: 수정·삭제 대상 배너 ID",
] as const;

export function formatAssistantScopePolicyForPrompt(): string {
  return [
    "## 처리 가능 범위",
    `- ${ASSISTANT_SCOPE_SUMMARY}만 지원합니다.`,
    "",
    "## 처리 불가 (반드시 거절)",
    "아래에 해당하면 실행 도구·lookup을 사용하지 마세요.",
    `- action.type: NONE`,
    `- summary: 요청을 이해했다는 한 줄 + 거절 안내`,
    `- recommended_action: 관리 화면에서 직접 처리하라고 안내`,
    "",
    "거절 대상:",
    ...ASSISTANT_OUT_OF_SCOPE_TOPICS.map((topic) => `- ${topic}`),
    "",
    `거절 안내 문구(요지): "${ASSISTANT_REFUSAL_MESSAGE}"`,
    "거절 시 다른 도구에 억지로 매핑하지 마세요.",
  ].join("\n");
}

export function formatAssistantNoticeFieldDocs(): string {
  return ASSISTANT_NOTICE_FIELD_DOCS.map((line) => `- ${line}`).join("\n");
}

export function formatAssistantBannerFieldDocs(): string {
  return ASSISTANT_BANNER_FIELD_DOCS.map((line) => `- ${line}`).join("\n");
}
