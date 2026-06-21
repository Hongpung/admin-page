export const RESERVATION_WEEK_DISMISS_EVENT = "reservation-week:dismiss";

/** Provider 밖(사이드바 등)에서 예약 주간 UI 오버레이를 닫을 때 사용 */
export function dismissReservationWeekOverlays(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(RESERVATION_WEEK_DISMISS_EVENT));
}
