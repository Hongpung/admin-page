import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { MonthlyCalendarReservations } from "../../api/reservation-api";
import { useDateStore } from "../../store/date-store";
import { monthlyReservationsQueryOptions } from "../../queries";

export function useReservationCalendarState() {
  const { selectedDate, selectDate } = useDateStore();
  const [calendarYear, setYear] = useState(
    selectedDate ? selectedDate.getFullYear() : new Date().getFullYear(),
  );
  const [calendarMonth, setMonth] = useState(
    selectedDate ? selectedDate.getMonth() : new Date().getMonth(),
  );
  useEffect(() => {
    const utcTime = new Date();
    const koreanTime = new Date(utcTime.getTime() + 9 * 60 * 60 * 1000);
    const koreanDate = new Date(
      koreanTime.toISOString().split("T")[0] + "T00:00Z",
    );
    selectDate(koreanDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 오늘(한국) 하루만 동기화
  }, []);

  const monthlyReservationsQuery = useQuery(
    monthlyReservationsQueryOptions({
      year: calendarYear,
      month: calendarMonth + 1,
    }),
  );
  const reservedDates =
    (monthlyReservationsQuery.data as MonthlyCalendarReservations | undefined) ??
    {};

  const goNextMonth = useCallback(() => {
    const newDate = new Date(calendarYear, calendarMonth);
    newDate.setMonth(calendarMonth + 1);
    if (newDate.getFullYear() !== calendarYear) setYear(newDate.getFullYear());
    setMonth(newDate.getMonth());
  }, [calendarYear, calendarMonth]);

  const goPrevMonth = useCallback(() => {
    const newDate = new Date(calendarYear, calendarMonth);
    newDate.setMonth(calendarMonth - 1);
    if (newDate.getFullYear() !== calendarYear) setYear(newDate.getFullYear());
    setMonth(newDate.getMonth());
  }, [calendarYear, calendarMonth]);

  return {
    selectedDate,
    calendarYear,
    calendarMonth,
    reservedDates,
    goNextMonth,
    goPrevMonth,
    selectDate,
  };
}
