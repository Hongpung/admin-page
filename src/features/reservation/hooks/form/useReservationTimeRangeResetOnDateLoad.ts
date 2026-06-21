"use client";

import { useEffect, useRef } from "react";

type Args = {
  date?: string;
  isLoaded: boolean;
  shouldReset: boolean;
  clearTimeRange: () => void;
};

export function useReservationTimeRangeResetOnDateLoad({
  date,
  isLoaded,
  shouldReset,
  clearTimeRange,
}: Args) {
  const latestLoadedDateRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!date || !isLoaded) return;

    const previousLoadedDate = latestLoadedDateRef.current;
    const isNewDate = previousLoadedDate !== date;
    latestLoadedDateRef.current = date;

    if (!isNewDate || !shouldReset) return;

    clearTimeRange();
  }, [clearTimeRange, date, isLoaded, shouldReset]);
}
