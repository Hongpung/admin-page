export type WeekReservationGridCellMetrics = {
  timeRulerHeightPx?: number;
  columnWidthPx: number;
  halfHourHeightPx: number;
};

export type WeekReservationGridProps = {
  cellMetrics?: WeekReservationGridCellMetrics;
  columnWidthPx?: number;
  halfHourHeightPx?: number;
  timeRulerHeightPx?: number;
};

export const DEFAULT_WEEK_RESERVATION_GRID_CELL_METRICS: WeekReservationGridCellMetrics =
  {
    columnWidthPx: 96,
    halfHourHeightPx: 40,
    timeRulerHeightPx: 28,
  };

export function toWeekReservationGridCellMetrics(
  props: WeekReservationGridProps,
): WeekReservationGridCellMetrics {
  if (props.cellMetrics != null) {
    return {
      columnWidthPx: props.cellMetrics.columnWidthPx,
      halfHourHeightPx: props.cellMetrics.halfHourHeightPx,
      timeRulerHeightPx:
        props.cellMetrics.timeRulerHeightPx ??
        DEFAULT_WEEK_RESERVATION_GRID_CELL_METRICS.timeRulerHeightPx,
    };
  }

  return {
    columnWidthPx:
      props.columnWidthPx ??
      DEFAULT_WEEK_RESERVATION_GRID_CELL_METRICS.columnWidthPx,
    halfHourHeightPx:
      props.halfHourHeightPx ??
      DEFAULT_WEEK_RESERVATION_GRID_CELL_METRICS.halfHourHeightPx,
    timeRulerHeightPx:
      props.timeRulerHeightPx ??
      DEFAULT_WEEK_RESERVATION_GRID_CELL_METRICS.timeRulerHeightPx,
  };
}
