import { TimeArray } from "../constants/constants";
import type { TimeFormat } from "../constants/constants";
import type { OccupiedReservation } from "../types";

export function findOverlappingReservations(
  start: TimeFormat,
  end: TimeFormat,
  existReservations: OccupiedReservation[] | null,
  excludeReservationId?: number
): OccupiedReservation[] | null {
  const startIndex = TimeArray.indexOf(start);
  const endIndex = TimeArray.indexOf(end);
  if (startIndex < 0 || endIndex < 0) return null;

  const lower = Math.min(startIndex, endIndex);
  const upper = Math.max(startIndex, endIndex);
  const selectedRange = TimeArray.slice(lower, upper);

  const overlapped =
    existReservations?.filter((reservation) => {
      if (
        excludeReservationId !== undefined &&
        reservation.reservationId === excludeReservationId
      ) {
        return false;
      }
      return selectedRange.some((time) => reservation.range?.includes(time));
    }) ?? null;

  return overlapped;
}
