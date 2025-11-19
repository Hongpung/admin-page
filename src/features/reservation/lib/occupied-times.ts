import { TimeArray } from "../constants/constants";
import type { TimeFormat } from "../constants/constants";
import type { ExistReservation, OccupiedReservation } from "../types";

export function buildOccupiedStateFromReservations(
  reservations: ExistReservation[],
  excludeReservationId?: number
): { occupiedTimes: TimeFormat[]; existReservations: OccupiedReservation[] } {
  const oTimes: TimeFormat[] = [];
  const eReservations: OccupiedReservation[] = [];

  reservations.forEach(({ startTime, endTime, ...reservation }) => {
    if (reservation.reservationId === excludeReservationId) return;
    const startIndex = TimeArray.indexOf(startTime);
    const endIndex = TimeArray.indexOf(endTime);

    const selectedRange = TimeArray.slice(startIndex, endIndex);

    const reservationInformation: OccupiedReservation = {
      range: selectedRange,
      startTime,
      endTime,
      ...reservation,
    };
    oTimes.push(...selectedRange);
    eReservations.push(reservationInformation);
  });

  return { occupiedTimes: oTimes, existReservations: eReservations };
}
