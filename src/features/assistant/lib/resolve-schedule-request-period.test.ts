import { describe, expect, it } from "vitest";
import {
  countInclusiveDays,
  isSchedulePeriodOverOneWeek,
  resolveScheduleRequestPeriod,
  shouldUseBatchScheduleForPeriod,
} from "./resolve-schedule-request-period";

const INLINE = `홍익대학교 풍물패연합 사전전수 시간표. 7/6(월): 13:00-15:00 오금반(담당가, 담당나), 15:00-19:00 고깔소고춤(담당다). 7/7(화): 11:00-13:00 설장구(담당라).`;

describe("resolveScheduleRequestPeriod", () => {
  it("counts inclusive days for an explicit korean range", () => {
    const period = resolveScheduleRequestPeriod(
      "2026년 7월 6일부터 7월 12일까지 한 주간 예약 추가",
      INLINE,
    );

    expect(period).toMatchObject({
      startDate: "2026-07-06",
      endDate: "2026-07-12",
      inclusiveDays: 7,
    });
    expect(isSchedulePeriodOverOneWeek(period!)).toBe(false);
    expect(
      shouldUseBatchScheduleForPeriod(
        "2026년 7월 6일부터 7월 12일까지 한 주간 예약 추가",
        INLINE,
      ),
    ).toBe(false);
  });

  it("uses batch when requested period exceeds one week", () => {
    const period = resolveScheduleRequestPeriod(
      "2026년 7월 6일부터 7월 20일까지 사전전수 시간표대로 정기 예약",
      INLINE,
    );

    expect(period).toMatchObject({
      startDate: "2026-07-06",
      endDate: "2026-07-20",
      inclusiveDays: 15,
    });
    expect(shouldUseBatchScheduleForPeriod(
      "2026년 7월 6일부터 7월 20일까지 사전전수 시간표대로 정기 예약",
      INLINE,
    )).toBe(true);
  });

  it("treats exactly seven inclusive days as within one week", () => {
    expect(countInclusiveDays("2026-07-06", "2026-07-12")).toBe(7);
    expect(isSchedulePeriodOverOneWeek({
      startDate: "2026-07-06",
      endDate: "2026-07-12",
      inclusiveDays: 7,
    })).toBe(false);
  });
});
