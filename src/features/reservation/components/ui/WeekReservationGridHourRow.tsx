import {
  addThirtyMinutes,
  daysOfWeek,
  type TimeFormat,
  weekdays_ko,
} from "../../constants/constants";
import type { WeeklyReservationsMap } from "../../types";
import { WeekReservationGridCell } from "./WeekReservationGridCell";

type Props = {
  hour: TimeFormat;
  weeklyReservations: WeeklyReservationsMap;
  selectedDate: Date;
  columnWidthPx: number;
  halfHourHeightPx: number;
  onReservationClick: (reservationId: number) => void;
};

export function WeekReservationGridHourRow({
  hour,
  weeklyReservations,
  selectedDate,
  columnWidthPx,
  halfHourHeightPx,
  onReservationClick,
}: Props) {
  const firstHalf = hour;
  const secondHalf = addThirtyMinutes(hour);

  return (
    <tr style={{ height: halfHourHeightPx * 2 }}>
      {weekdays_ko.map((day) => {
        const reservationFirst = weeklyReservations[day]?.[firstHalf];
        const reservationSecond = weeklyReservations[day]?.[secondHalf];
        const selected =
          selectedDate.getDay() ===
          daysOfWeek.findIndex((dayKo) => dayKo === day);

        return (
          <td
            key={`${day}-${hour}`}
            className={`border-l border-r p-0 ${selected ? "bg-blue-50" : ""} ${
              reservationSecond
                ? reservationSecond.isEnd
                  ? "border-b"
                  : `border-b border-b-${reservationSecond.color}`
                : "border-b"
            } ${
              reservationFirst
                ? reservationFirst.isStart
                  ? "border-t"
                  : `border-t border-t-${reservationFirst.color}`
                : "border-t"
            }`}
            style={{ width: columnWidthPx }}
          >
            {reservationFirst ? (
              <WeekReservationGridCell
                reservation={reservationFirst.reservation}
                color={reservationFirst.color}
                isStart={reservationFirst.isStart}
                isEnd={reservationFirst.isEnd}
                halfHourHeightPx={halfHourHeightPx}
                onClick={() =>
                  onReservationClick(reservationFirst.reservation.reservationId)
                }
              />
            ) : (
              <div
                className="w-full flex flex-col"
                style={{ height: halfHourHeightPx }}
              />
            )}
            {reservationSecond ? (
              <WeekReservationGridCell
                reservation={reservationSecond.reservation}
                color={reservationSecond.color}
                isStart={reservationSecond.isStart}
                isEnd={reservationSecond.isEnd}
                halfHourHeightPx={halfHourHeightPx}
                onClick={() =>
                  onReservationClick(
                    reservationSecond.reservation.reservationId,
                  )
                }
              />
            ) : (
              <div
                className="w-full flex flex-col"
                style={{ height: halfHourHeightPx }}
              />
            )}
          </td>
        );
      })}
    </tr>
  );
}
