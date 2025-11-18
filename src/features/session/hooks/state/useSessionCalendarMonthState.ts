import { useCallback, useEffect, useState } from "react";

export function useSessionCalendarMonthState(selectedDate: Date) {
  const [calendarYear, setCalendarYear] = useState(selectedDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(selectedDate.getMonth());

  useEffect(() => {
    setCalendarYear(selectedDate.getFullYear());
    setCalendarMonth(selectedDate.getMonth());
  }, [selectedDate]);

  const goNextMonth = useCallback(() => {
    const next = new Date(calendarYear, calendarMonth);
    next.setMonth(calendarMonth + 1);
    if (next.getFullYear() !== calendarYear) {
      setCalendarYear(next.getFullYear());
    }
    setCalendarMonth(next.getMonth());
  }, [calendarMonth, calendarYear]);

  const goPrevMonth = useCallback(() => {
    const prev = new Date(calendarYear, calendarMonth);
    prev.setMonth(calendarMonth - 1);
    if (prev.getFullYear() !== calendarYear) {
      setCalendarYear(prev.getFullYear());
    }
    setCalendarMonth(prev.getMonth());
  }, [calendarMonth, calendarYear]);

  return {
    calendarMonth,
    calendarYear,
    goNextMonth,
    goPrevMonth,
  };
}
