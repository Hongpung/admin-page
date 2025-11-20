"use client";

import { useCallback, type ChangeEvent } from "react";
import type { TimeFormat } from "../../constants/constants";
import { confirmWithConflictList } from "../../lib/reservation-time-conflict-messages";
import { RESERVATION_MESSAGE } from "../../constants/reservation-message.constants";
import type { OccupiedReservation } from "../../types";

type IsConflictFn = (
  start: TimeFormat,
  end: TimeFormat
) => OccupiedReservation[] | null;

export function useReservationTimeRangeHandlers({
  endTime,
  startTime,
  occupiedTimes,
  isConflict,
  setStartTime,
  setEndTime,
}: {
  endTime: TimeFormat | undefined;
  startTime: TimeFormat | undefined;
  occupiedTimes: TimeFormat[] | null | undefined;
  isConflict: IsConflictFn;
  setStartTime: (t: TimeFormat) => void;
  setEndTime: (t: TimeFormat) => void;
}) {
  const handleStartChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newStartTime = e.currentTarget.value as TimeFormat;
      if (occupiedTimes?.includes(newStartTime)) {
        if (
          !confirm(RESERVATION_MESSAGE.occupiedTimeConfirm)
        ) {
          return;
        }
      } else if (endTime) {
        const conflictReservations = isConflict(newStartTime, endTime);
        if (conflictReservations && conflictReservations.length > 0) {
          if (
            !confirmWithConflictList(
              conflictReservations,
              RESERVATION_MESSAGE.conflictIntro
            )
          ) {
            return;
          }
        }
      }
      setStartTime(newStartTime);
    },
    [endTime, occupiedTimes, isConflict, setStartTime]
  );

  const handleEndChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newEndTime = e.currentTarget.value as TimeFormat;
      if (occupiedTimes?.includes(newEndTime)) {
        if (
          !confirm(RESERVATION_MESSAGE.endTimeConflictConfirm)
        ) {
          return;
        }
      } else if (startTime) {
        const conflictReservations = isConflict(startTime, newEndTime);
        if (conflictReservations && conflictReservations.length > 0) {
          if (
            !confirmWithConflictList(
              conflictReservations,
              RESERVATION_MESSAGE.conflictIntro
            )
          ) {
            return;
          }
        }
      }
      setEndTime(newEndTime);
    },
    [startTime, occupiedTimes, isConflict, setEndTime]
  );

  return { handleStartChange, handleEndChange };
}
