import { hourlySlots, weekdays_ko } from "../../constants/constants";
import type { WeekReservationGridCellMetrics } from "../../lib/week-grid-metrics";
import type { WeeklyReservationsMap } from "../../types";
import { WeekReservationGridHourRow } from "./WeekReservationGridHourRow";

type Props = {
  weekDates: string[];
  weeklyReservations: WeeklyReservationsMap;
  selectedDate: Date;
  onReservationClick: (reservationId: number) => void;
  cellMetrics: WeekReservationGridCellMetrics;
};

export function WeekReservationGridTable({
  weekDates,
  weeklyReservations,
  selectedDate,
  onReservationClick,
  cellMetrics,
}: Props) {
  const safeCellMetrics =
    cellMetrics ??
    ({
      columnWidthPx: 96,
      halfHourHeightPx: 32,
      timeRulerHeightPx: 44,
    } as const);

  const {
    columnWidthPx,
    halfHourHeightPx,
    timeRulerHeightPx = 20,
  } = safeCellMetrics;
  const hourRowHeightPx = halfHourHeightPx * 2;

  return (
    <div className="w-full flex flex-row items-start gap-2">
      <div
        className="flex flex-col shrink-0 text-gray-300"
        style={{ marginTop: timeRulerHeightPx, gap: 0 }}
      >
        {[...hourlySlots].map((hour) => (
          <div
            key={`${hour}-line`}
            className="flex flex-col justify-center shrink-0"
            style={{ height: hourRowHeightPx }}
          >
            {hour}
          </div>
        ))}
      </div>
      <table
        className="min-w-0 flex-grow self-start border-collapse"
        style={{ tableLayout: "fixed", height: "auto" }}
      >
        <thead>
          <tr>
            {Array.from({ length: 7 }, (_, index) => index).map((index) => (
              <th
                key={index}
                className="border py-2"
                style={{ width: columnWidthPx, minHeight: 40 }}
              >
                <div className="flex flex-col">
                  <div>{weekDates[index]}</div>
                  <div>({weekdays_ko[index]})</div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hourlySlots.map((hour) => (
            <WeekReservationGridHourRow
              key={hour}
              hour={hour}
              weeklyReservations={weeklyReservations}
              selectedDate={selectedDate}
              columnWidthPx={columnWidthPx}
              halfHourHeightPx={halfHourHeightPx}
              onReservationClick={onReservationClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type WeekReservationGridProps = Props;
