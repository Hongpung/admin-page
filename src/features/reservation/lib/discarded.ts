import dayjs from "dayjs";
import "dayjs/locale/ko";
import { daysOfWeek } from "../constants/constants";
import { parseYmdToLocalDate } from "../types/schemas/common.schema";
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

export function formatDiscardedReservationSchedule(
  date: string,
  startTime: string,
  endTime: string,
): string {
  const parsed = parseYmdToLocalDate(date);
  const weekday = parsed ? daysOfWeek[parsed.getDay()] : null;
  const dateLabel = weekday ? `${date} (${weekday})` : date;
  return `${dateLabel}\n${startTime} ~ ${endTime}`;
}
