import { WeekReservationGridContent } from "./WeekReservationGridContent";
import {
  toWeekReservationGridCellMetrics,
  type WeekReservationGridCellMetrics,
  type WeekReservationGridProps,
} from "../../lib/week-grid-metrics";

export default function WeekReservationGrid(
  props: WeekReservationGridProps = {},
) {
  return (
    <WeekReservationGridContent
      cellMetrics={toWeekReservationGridCellMetrics(props)}
    />
  );
}

export type { WeekReservationGridCellMetrics };
