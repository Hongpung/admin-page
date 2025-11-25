import { describe, expect, it } from "vitest";
import { toWeekReservationGridCellMetrics } from "./week-grid-metrics";

describe("week-grid-metrics", () => {
  it("uses defaults when props are omitted", () => {
    expect(toWeekReservationGridCellMetrics({})).toEqual({
      columnWidthPx: 96,
      halfHourHeightPx: 40,
      timeRulerHeightPx: 28,
    });
  });

  it("normalizes legacy scalar props and partial cellMetrics", () => {
    expect(
      toWeekReservationGridCellMetrics({
        columnWidthPx: 120,
        halfHourHeightPx: 44,
      }),
    ).toEqual({
      columnWidthPx: 120,
      halfHourHeightPx: 44,
      timeRulerHeightPx: 28,
    });

    expect(
      toWeekReservationGridCellMetrics({
        cellMetrics: {
          columnWidthPx: 80,
          halfHourHeightPx: 30,
        },
      }),
    ).toEqual({
      columnWidthPx: 80,
      halfHourHeightPx: 30,
      timeRulerHeightPx: 28,
    });
  });
});
