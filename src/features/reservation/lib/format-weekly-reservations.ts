import {
  daysOfWeek,
  renderColor,
  TimeArray,
  type TimeFormat,
} from "../constants/constants";
import type { DateReservation, WeeklyReservationsMap } from "../types";

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/** 시작 시각이 속한 30분 슬롯(내림) */
function floorToHalfHourSlot(time: string): TimeFormat | null {
  const floored = Math.floor(parseTimeToMinutes(time) / 30) * 30;
  const slot = minutesToTime(floored);
  return TimeArray.includes(slot as TimeFormat) ? (slot as TimeFormat) : null;
}

/** slice 종료 인덱스 — endTime이 슬롯 경계면 해당 인덱스, 아니면 다음 30분 경계 */
function resolveEndSlotIndex(endTime: string): number {
  const exactIndex = TimeArray.indexOf(endTime as TimeFormat);
  if (exactIndex !== -1) return exactIndex;

  const ceiled = Math.ceil(parseTimeToMinutes(endTime) / 30) * 30;
  const slot = minutesToTime(ceiled);
  const ceiledIndex = TimeArray.indexOf(slot as TimeFormat);
  return ceiledIndex === -1 ? TimeArray.length : ceiledIndex;
}

export function formattingReservationsForTable(
  reservations: DateReservation[]
): WeeklyReservationsMap {
  const reservationMap: WeeklyReservationsMap = {};

  if (reservations.length === 0) return {};

  reservations.forEach((reservation, idx) => {
    const startSlot = floorToHalfHourSlot(reservation.startTime);
    if (!startSlot) return;

    const startIndex = TimeArray.indexOf(startSlot);
    const endIndex = resolveEndSlotIndex(reservation.endTime);

    if (startIndex === -1 || endIndex <= startIndex) return;

    const selectedRange = TimeArray.slice(startIndex, endIndex);
    const weekday =
      daysOfWeek[new Date(reservation.date + "T00:00Z").getDay()];

    selectedRange.forEach((time, index) => {
      if (!reservationMap[weekday]) {
        reservationMap[weekday] = {};
      }

      reservationMap[weekday][time] = {
        reservation,
        isStart: index === 0,
        isEnd: index === selectedRange.length - 1,
        color: renderColor[idx % 8],
      };
    });
  });

  return reservationMap;
}
