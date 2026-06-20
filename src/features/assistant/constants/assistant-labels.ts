export const ASSISTANT_LABELS = {
  title: "AI 어시스턴트",
  subtitle: "연습 일정 이미지 분석 및 예약 보조",
  modalTrigger: "AI 어시스턴트 열기",
  modalClose: "AI 어시스턴트 닫기",
  welcomeTitle: "무엇을 도와드릴까요?",
  welcomeSubtitle:
    "연습 시간표 이미지를 첨부하고 요청을 입력하면, 정기 예약 생성을 도와드립니다.",
  composerPlaceholder: "예: 다음달부터 2달간 월수금 18-20시 정기연습 넣어줘",
  composerInput: "메시지 입력",
  uploadButton: "이미지 첨부",
  send: "보내기",
  cancel: "취소",
  scrollToBottom: "아래로 이동",
  analysisDetails: "분석 상세",
  monthlyUsage: (used: number, limit: number) =>
    `이번 달 사용량 ${used}/${limit}`,
} as const;

export const ASSISTANT_ATTACHMENT_LIMITS = {
  maxSizeMb: 5,
  accept: "image/png,image/jpeg,image/webp",
} as const;
