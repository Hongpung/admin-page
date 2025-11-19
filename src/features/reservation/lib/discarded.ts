import dayjs from "dayjs";
import type { DiscardedReservationDiscardReason } from "../types";

export const DISCARD_REASON_LABELS: Record<
  DiscardedReservationDiscardReason,
  string
> = {
  NO_SHOW: "노쇼 (시간 내 미시작)",
  ADMIN_FORCE_DISCARD: "관리자 강제 폐기",
  SYSTEM_RECOVERY: "시스템 복구 (서버 다운)",
};

export function formatDiscardedRowCreatedAt(iso: string): string {
  return dayjs(iso).locale("ko").format("YYYY.MM.DD. A hh시 mm분"); // 예: 2024.06.30. 오후 3:45:12
}
