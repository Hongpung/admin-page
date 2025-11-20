import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { TimeFormat } from "../../constants/constants";
import { buildOccupiedStateFromReservations } from "../../lib/occupied-times";
import type { ExistReservation, OccupiedReservation } from "../../types";
import { dailyOccupiedTimesQueryOptions } from "../../queries";

export function useDailyOccupiedTimes(
  date: string | undefined,
  excludeReservationId?: number,
) {
  const occupiedQuery = useQuery({
    ...dailyOccupiedTimesQueryOptions(date ? new Date(date) : new Date()),
    enabled: Boolean(date),
  });

  const occupiedState = useMemo(() => {
    if (!occupiedQuery.data) {
      return { occupiedTimes: null, existReservations: null };
    }
    const { occupiedTimes, existReservations } =
      buildOccupiedStateFromReservations(
        occupiedQuery.data as ExistReservation[],
        excludeReservationId,
      );
    return { occupiedTimes, existReservations };
  }, [excludeReservationId, occupiedQuery.data]);

  return {
    occupiedTimes: occupiedState.occupiedTimes as TimeFormat[] | null,
    existReservations:
      occupiedState.existReservations as OccupiedReservation[] | null,
    isSuccess: occupiedQuery.isSuccess,
    isError: occupiedQuery.isError,
  };
}
