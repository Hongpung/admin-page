import type { WeekDay } from "../constants/constants";
import type { TimeFormat } from "../constants/constants";
import { parseYmdToLocalDate } from "../types/schemas/common.schema";
import type { BatchReservationDto } from "../types/schemas";
import type { ExistReservation } from "../types";
import { findOverlappingReservations } from "../lib/reservation-conflict";
import { buildOccupiedStateFromReservations } from "../lib/occupied-times";

export type BatchSubmitConflict = {
  reservationId: number;
  title: string;
  creatorName: string;
  date: string;
  startTime: TimeFormat;
  endTime: TimeFormat;
};

const JS_DAY_TO_WEEKDAY: WeekDay[] = ["일", "월", "화", "수", "목", "금", "토"];

function formatYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function enumerateDateRange(startDate: string, endDate: string): string[] {
  const start = parseYmdToLocalDate(startDate);
  const end = parseYmdToLocalDate(endDate);
  if (!start || !end || start > end) return [];

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(formatYmd(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function enumerateDates(startDate: string, endDate: string): string[] {
  return enumerateDateRange(startDate, endDate);
}

function weekdayFromDateString(date: string): WeekDay | null {
  const parsed = parseYmdToLocalDate(date);
  if (!parsed) return null;
  return JS_DAY_TO_WEEKDAY[parsed.getDay()] ?? null;
}

function conflictKey(conflict: BatchSubmitConflict): string {
  return `${conflict.reservationId}:${conflict.date}`;
}

type DailyReservationsByDate = Record<string, ExistReservation[]>;

/**
 * 정기 일괄 생성 제출 시 취소될 수 있는 기존 예약 목록을 계산합니다.
 */
export function collectBatchSubmitConflicts(
  payload: BatchReservationDto,
  reservationsByDate: DailyReservationsByDate,
): BatchSubmitConflict[] {
  const conflicts: BatchSubmitConflict[] = [];
  const seen = new Set<string>();

  for (const date of enumerateDates(
    payload.duration.startDate,
    payload.duration.endDate,
  )) {
    const weekday = weekdayFromDateString(date);
    if (!weekday) continue;

    const slots = payload.dayTimes.filter((slot) => slot.day === weekday);
    if (slots.length === 0) continue;

    const reservations = reservationsByDate[date] ?? [];
    const { existReservations } = buildOccupiedStateFromReservations(reservations);

    for (const slot of slots) {
      const overlapped =
        findOverlappingReservations(
          slot.startTime,
          slot.endTime,
          existReservations,
        ) ?? [];

      for (const reservation of overlapped) {
        const item: BatchSubmitConflict = {
          reservationId: reservation.reservationId,
          title: reservation.title,
          creatorName: reservation.creatorName,
          date,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
        };
        const key = conflictKey(item);
        if (seen.has(key)) continue;
        seen.add(key);
        conflicts.push(item);
      }
    }
  }

  return conflicts.sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}
