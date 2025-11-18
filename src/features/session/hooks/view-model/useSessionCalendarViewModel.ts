import { useCallback, useMemo } from "react";
import { toDateKeyLocal } from "../../lib";

function firstDayWithSessionsInMonth(
  year: number,
  month: number,
  countsByDate: Record<string, number>,
): Date | null {
  const last = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= last; day++) {
    const date = new Date(year, month, day, 0, 0, 0);
    const key = toDateKeyLocal(date);
    if ((countsByDate[key] ?? 0) > 0) return date;
  }

  return null;
}

export function useSessionCalendarViewModel({
  calendarMonth,
  calendarYear,
  countsByDateRaw,
}: {
  calendarMonth: number;
  calendarYear: number;
  countsByDateRaw: Record<string, number> | undefined;
}) {
  const countsByDate = useMemo(() => countsByDateRaw ?? {}, [countsByDateRaw]);

  const findFirstSessionDateInShownMonth = useCallback(() => {
    return firstDayWithSessionsInMonth(calendarYear, calendarMonth, countsByDate);
  }, [calendarMonth, calendarYear, countsByDate]);

  const isDateSelectable = useCallback(
    (ctx: { date: Date }) => (countsByDate[toDateKeyLocal(ctx.date)] ?? 0) > 0,
    [countsByDate],
  );

  const getDayCount = useCallback(
    (date: Date) => countsByDate[toDateKeyLocal(date)] ?? 0,
    [countsByDate],
  );

  return {
    countsByDate,
    findFirstSessionDateInShownMonth,
    getDayCount,
    isDateSelectable,
  };
}
