import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { formattingReservationsForTable } from "../../lib/format-weekly-reservations";
import { getWeekDates, parseLocalDateFromYmd } from "../../lib/week-date-utils";
import type { WeeklyReservationsMap } from "../../types";
import { weeklyReservationsQueryOptions } from "../../queries";

type ModalState = "Create" | "CreateBatch" | "Edit" | "None";

export function useWeeklyReservationsGrid(
  startOfWeek: string,
  endOfWeek: string,
  modalState: ModalState,
) {
  const { data: weeklyReserves } = useQuery({
    ...weeklyReservationsQueryOptions(startOfWeek, endOfWeek),
    enabled:
      modalState === "None" &&
      startOfWeek.trim().length > 0 &&
      endOfWeek.trim().length > 0,
  });

  const weekDates = useMemo(() => {
    if (!startOfWeek.trim() || !weeklyReserves) return [];
    return getWeekDates(parseLocalDateFromYmd(startOfWeek));
  }, [startOfWeek, weeklyReserves]);

  const weeklyReservations = useMemo<WeeklyReservationsMap>(() => {
    if (!weeklyReserves) return {};
    return formattingReservationsForTable(weeklyReserves);
  }, [weeklyReserves]);

  return { weekDates, weeklyReservations };
}
