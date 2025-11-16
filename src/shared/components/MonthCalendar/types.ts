import type { ReactNode } from "react";

export type MonthCalendarDayContext = {
  day: number;
  date: Date;
  gridIndex: number;
};

export type MonthCalendarProps = {
  year: number;
  month: number;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  /** 날짜 숫자 아래 영역 (예: 예약 수 표시) */
  renderDayFooter?: (ctx: MonthCalendarDayContext) => ReactNode;
  /** false면 해당 날짜는 클릭되어도 선택되지 않습니다. */
  isDateSelectable?: (ctx: MonthCalendarDayContext) => boolean;
  weekdayLabels?: readonly string[];
  className?: string;
  /** false면 선택된 주의 전체 배경(라운드)은 그리지 않습니다. */
  highlightWeek?: boolean;
};
