export const ADMIN_MANAGE_MESSAGE = {
  listLoadFailed: "목록을 불러오지 못했습니다.",
  sessionLoadFailed: "세션 정보를 불러오지 못했습니다.",
  changeSuccess: "권한이 변경되었습니다.",
  changeFailed: "변경에 실패했습니다.",
  revokeSuccess: "관리자 권한이 제거되었습니다.",
  revokeFailed: "제거에 실패했습니다.",
  grantSuccess: "관리자 권한이 부여되었습니다.",
  grantFailed: "권한 부여에 실패했습니다.",
  alreadyAdmin: "이미 관리자입니다.",
  selfGrantBlocked: "본인에게는 권한을 부여할 수 없습니다.",
  confirmRevoke: (name: string) => `${name}님의 관리자 권한을 제거하시겠습니까?`,
} as const;
