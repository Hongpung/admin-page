export const ASSISTANT_LABELS = {
  title: "AI 어시스턴트",
  subtitle: "예약·공지·배너 관리 보조",
  modalTrigger: "AI 어시스턴트 열기",
  modalClose: "AI 어시스턴트 닫기",
  modalUnread: "새 답변이 있습니다",
  newSession: "새 대화",
  newSessionTooltip: "새 대화를 시작합니다",
  newSessionConfirm:
    "현재 대화를 끝내고 새로 시작할까요? 진행 중인 작업 초안은 이 기기에서만 사라집니다.",
  newSessionRunning: "응답 생성 중에는 새 대화를 시작할 수 없습니다",
  welcomeTitle: "무엇을 도와드릴까요?",
  welcomeSubtitle:
    "예약·공지·배너 등록·수정·삭제를 요청해주세요. 회원·관리자 권한 변경은 지원하지 않습니다.",
  composerPlaceholder:
    "예: 내일 예약 전부 취소 / 공지 올려줘 / 배너 링크 수정해줘",
  composerInput: "메시지 입력",
  uploadButton: "이미지 첨부",
  send: "보내기",
  cancel: "취소",
  scrollToBottom: "아래로 이동",
  analysisDetails: "인식된 텍스트",
  followUpTitle: "다음에 필요한 작업",
  followUpMissingFields: "추가로 알려주세요",
  inputCardTitle: "필요한 정보를 입력해주세요",
  inputCardTargetLabel: "대상",
  inputCardDescription:
    "아래 항목을 채우면 예약자 조회 등 나머지 확인을 이어서 진행합니다. 일부만 입력해도 됩니다.",
  inputSubmit: "입력 완료",
  inputSubmitting: "확인 중…",
  inputSubmitFailed: "입력 내용을 저장하지 못했습니다.",
  inputEmpty: "한 개 이상의 항목을 입력해주세요.",
  inputRoomMissing: "대화 세션을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.",
  actionConfirmTitle: "실행 전 확인이 필요합니다",
  actionConfirmDescription:
    "아래 내용으로 관리자 API를 실행합니다. 직접 확인한 뒤 승인해주세요.",
  actionImpactTitle: "취소되는 기존 예약",
  actionImpactDescription:
    "이 요청과 시간이 겹치는 아래 예약이 취소됩니다.",
  actionImpactNone: "취소되는 기존 예약이 없습니다.",
  actionImpactLoading: "취소될 예약을 확인하는 중…",
  actionImpactLoadFailed:
    "취소 예약 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
  actionImpactTitleDelete: "삭제될 예약",
  actionImpactDescriptionDelete:
    "승인 시 아래 예약이 관리자 권한으로 삭제됩니다.",
  actionImpactNoneDelete: "삭제 대상 예약이 없습니다.",
  actionImpactLoadingDelete: "삭제될 예약을 확인하는 중…",
  actionImpactLoadFailedDelete:
    "삭제 예약 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
  actionImpactRetry: "다시 확인",
  actionApprove: "승인 후 실행",
  actionReject: "취소",
  actionExecuting: "실행 중…",
  actionRejected: "실행을 취소했습니다.",
  actionRetry: "다시 시도",
  actionQueueProgress: (index: number, total: number) =>
    `${index}/${total}번째 작업`,
  actionQueueNext: "다음 작업으로 이어갑니다.",
  actionHistoryTitle: "완료된 작업",
  actionHistorySuccess: "완료",
  actionHistorySkipped: "건너뜀",
  actionHistoryCancelled: "취소됨",
  actionExecutionBriefingTitle: "작업 완료 브리핑",
  actionFailedTitle: "작업 실행 실패",
  actionBlockedTitle: "작업을 진행할 수 없습니다",
  actionContinuePrompt: "다음 작업을 계속 진행할까요?",
  actionContinueYes: "다음 작업 계속",
  actionContinueNo: "여기서 중단",
  actionEditPayload: "내용 수정",
  actionExecuteFailed: "실행 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  monthlyUsage: (used: number, limit: number) =>
    `이번 달 사용량 ${used}/${limit}`,
} as const;

export const ASSISTANT_ATTACHMENT_LIMITS = {
  maxSizeMb: 5,
  accept: "image/png,image/jpeg,image/webp",
} as const;
