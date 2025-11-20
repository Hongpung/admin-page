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
    if (!date || !isLoaded || !shouldReset) return;
    if (latestLoadedDateRef.current === date) return;

    latestLoadedDateRef.current = date;
    clearTimeRange();
  }, [clearTimeRange, date, isLoaded, shouldReset]);
}
