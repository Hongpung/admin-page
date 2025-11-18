"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import MonthCalendar from "@admin/shared/components/MonthCalendar";
import { useSessionCalendarMonthState } from "../../hooks/state";
import { useSessionCalendarViewModel } from "../../hooks/view-model";
import { sessionMonthCalendarQueryOptions } from "../../queries";

export type SessionLogCalendarProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

export function SessionLogCalendar({
  selectedDate,
  onSelectDate,
}: SessionLogCalendarProps) {
  const { calendarYear, calendarMonth, goNextMonth, goPrevMonth } =
    useSessionCalendarMonthState(selectedDate);

  const onSelectDateRef = useRef(onSelectDate);
  onSelectDateRef.current = onSelectDate;

  const countsByDateQuery = useQuery(
    sessionMonthCalendarQueryOptions(calendarYear, calendarMonth + 1),
  );
  const { findFirstSessionDateInShownMonth, getDayCount, isDateSelectable } =
    useSessionCalendarViewModel({
      calendarMonth,
      calendarYear,
      countsByDateRaw: countsByDateQuery.data,
    });

  /** 표시 중인 월에서 선택일에 세션이 없으면, 해당 월 첫 세션일로 맞춤 */
  useEffect(() => {
    if (selectedDate.getFullYear() !== calendarYear) return;
    if (selectedDate.getMonth() !== calendarMonth) return;
    if (getDayCount(selectedDate) > 0) return;

    const first = findFirstSessionDateInShownMonth();
    if (first) {
      onSelectDateRef.current(first);
    }
  }, [
    calendarMonth,
    calendarYear,
    findFirstSessionDateInShownMonth,
    getDayCount,
    selectedDate,
  ]);

  return (
    <MonthCalendar
      className="px-2 pb-2"
      year={calendarYear}
      month={calendarMonth}
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
      onPrevMonth={goPrevMonth}
      onNextMonth={goNextMonth}
      highlightWeek={false}
      isDateSelectable={isDateSelectable}
      renderDayFooter={({ date }) => {
        const count = getDayCount(date);
        return (
          <div className="relative mx-0.5 min-h-2 flex justify-center items-start pt-0.5">
            {count != null && count > 0 ? (
              <>
                <div
                  className="absolute -top-4 right-0.5 size-1 shrink-0 bg-red-500 rounded-full"
                  aria-hidden
                />
                <span className="text-sm leading-none text-gray-400">
                  {count}
                </span>
              </>
            ) : null}
          </div>
        );
      }}
    />
  );
}
