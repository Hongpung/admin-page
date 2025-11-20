"use client";

import MonthCalendar from "@admin/shared/components/MonthCalendar";
import { useReservationCalendarState } from "../../hooks/state";
import {
  getCalendarMoreCount,
  getCalendarReservationDotColor,
} from "../../lib/reservation-calendar";

export const ReservationCalendar: React.FC = () => {
  const {
    selectedDate,
    calendarYear,
    calendarMonth,
    reservedDates,
    goNextMonth,
    goPrevMonth,
    selectDate,
  } = useReservationCalendarState();

  return (
    <MonthCalendar
      year={calendarYear}
      month={calendarMonth}
      selectedDate={selectedDate}
      onSelectDate={(d) =>
        selectDate(new Date(d.getTime() + 9 * 60 * 60 * 1000))
      }
      onPrevMonth={goPrevMonth}
      onNextMonth={goNextMonth}
      renderDayFooter={({ day }) => (
        <>
          <div className="mx-1 h-4 flex justify-center flex-row items-center gap-0.5">
            {reservedDates[day]?.slice(0, 3).map((reservation) => (
                <div
                  key={`reservationId-${reservation.reservationId}`}
                  className={`h-1.5 w-1.5 rounded-full ${getCalendarReservationDotColor(
                    reservation,
                  )}`}
                />
              ))}
          </div>
          {getCalendarMoreCount(reservedDates[day]) > 0 && (
            <div className="text-xs text-gray-500">
              +{getCalendarMoreCount(reservedDates[day])}
            </div>
          )}
        </>
      )}
    />
  );
};
