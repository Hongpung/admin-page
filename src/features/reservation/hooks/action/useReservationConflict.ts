import { useCallback } from "react";
import type { TimeFormat } from "../../constants/constants";
import { findOverlappingReservations } from "../../lib/reservation-conflict";
import type { OccupiedReservation } from "../../types";

export function useReservationConflict(
  existReservations: OccupiedReservation[] | null,
  excludeReservationId?: number
) {
  return useCallback(
    (start: TimeFormat, end: TimeFormat) => {
      return findOverlappingReservations(
        start,
        end,
        existReservations,
        excludeReservationId
      );
    },
    [existReservations, excludeReservationId]
  );
}
