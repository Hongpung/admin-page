/** 대시보드 전용 레이아웃(헤더/푸터/메인 여백) 분기용 */
export function isDashboardPath(pathname: string): boolean {
  return (
    pathname.startsWith("/home") ||
    pathname.startsWith("/user") ||
    pathname.startsWith("/club") ||
    pathname.startsWith("/reservation") ||
    pathname.startsWith("/session") ||
    pathname.startsWith("/manage") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/instruments") ||
    pathname.startsWith("/logout")
  );
}
