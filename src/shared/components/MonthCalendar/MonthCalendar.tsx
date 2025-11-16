"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useMemo, useState } from "react";
import type { MonthCalendarDayContext, MonthCalendarProps } from "./types";
import { buildDaysInMonth, pickWeekDays } from "./utils";

const defaultWeekdayLabels = [
  "일",
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
] as const;

/**
 * 월 네비게이션 + 일자 그리드만 담당하는 공통 달력.
 * 도메인 데이터는 `renderDayFooter` 또는 상위 래퍼에서 처리합니다.
 */
export default function MonthCalendar({
  year,
  month,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  renderDayFooter,
  isDateSelectable,
  weekdayLabels = defaultWeekdayLabels,
  className = "",
  highlightWeek = true,
}: MonthCalendarProps) {
  const daysInMonth = useMemo(() => buildDaysInMonth(year, month), [year, month]);

  const [selectedWeek, setSelectedWeek] = useState<number[]>([]);

  useLayoutEffect(() => {
    if (
      selectedDate.getFullYear() !== year ||
      selectedDate.getMonth() !== month
    ) {
      setSelectedWeek([]);
      return;
    }
    const dayNum = selectedDate.getDate();
    const idx = daysInMonth.indexOf(dayNum);
    if (idx === -1) {
      setSelectedWeek([]);
      return;
    }
    setSelectedWeek(pickWeekDays(daysInMonth, idx));
  }, [year, month, selectedDate, daysInMonth]);

  const isSelectedDay = (day: number) =>
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year;

  const weeks: ReactNode[] = [];
  let days: ReactNode[] = [];
  let currentWeek: number[] = [];

  daysInMonth.forEach((day, index) => {
    if (day === 0) {
      days.push(<div className="w-8 h-8" key={`empty-${index}`} />);
    } else {
      const cellDate = new Date(year, month, day, 0, 0, 0);
      const dayCtx: MonthCalendarDayContext = {
        day,
        date: cellDate,
        gridIndex: index,
      };
      const selectable = isDateSelectable == null || isDateSelectable(dayCtx);

      const selectCurrentDate = () => {
        if (!selectable) return;
        setSelectedWeek(pickWeekDays(daysInMonth, index));
        onSelectDate(cellDate);
      };

      days.push(
        <div
          key={`date-${year}-${month}-${day}-${index}`}
          role="button"
          tabIndex={selectable ? 0 : -1}
          aria-disabled={!selectable}
          className={`w-8 rounded ${selectable ? "cursor-pointer" : "cursor-not-allowed opacity-40"} ${isSelectedDay(day) ? "bg-blue-200" : ""}`}
          onClick={selectCurrentDate}
          onKeyDown={(e) => {
            if (!selectable) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              selectCurrentDate();
            }
          }}
        >
          <div
            className={`w-8 h-5 text-center text-base ${isSelectedDay(day) ? "text-blue-500" : selectable ? "text-gray-500" : "text-gray-300"}`}
          >
            {day}
          </div>
          {renderDayFooter != null ? (
            renderDayFooter({ day, date: cellDate, gridIndex: index })
          ) : (
            <div className="mx-1 h-4" />
          )}
        </div>,
      );
      currentWeek.push(day);
    }

    if ((index + 1) % 7 === 0) {
      const isSelectedWeek = highlightWeek
        ? selectedWeek.some((d) => currentWeek.includes(d))
        : false;
      weeks.push(
        <div
          key={`week-${weeks.length}`}
          className={`mx-4 my-1 justify-between flex flex-row text-center ${isSelectedWeek &&
          selectedDate.getMonth() === month &&
          selectedDate.getFullYear() === year
            ? "rounded-md bg-blue-100"
            : ""
          }`}
        >
          {days}
        </div>,
      );
      weeks.push(<div key={`space-${weeks.length}`} className="h-2" />);
      days = [];
      currentWeek = [];
    }
  });

  return (
    <div className={className}>
      <div className="text-center text-gray-400">{`${year}년`}</div>
      <div className="flex flex-row justify-center gap-2">
        <div className="text-lg cursor-pointer" onClick={onPrevMonth}>
          {"<"}
        </div>
        <div className="text-lg">{`${month + 1}월`}</div>
        <div className="text-lg cursor-pointer" onClick={onNextMonth}>
          {">"}
        </div>
      </div>
      <div>
        <div className="mx-4 justify-between flex flex-row">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="w-8 h-8 text-center text-stone-400 text-lg"
            >
              {label}
            </div>
          ))}
        </div>
        {weeks}
        <div className="h-2" />
      </div>
    </div>
  );
}
