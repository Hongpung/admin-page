export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === "Is not admin") {
    return "관리자로 등록되지 않은 계정입니다.";
  }

  return "아이디 비밀번호 및 서버 상태를 확인해주세요.";
}
