import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ASSISTANT_MAX_RESERVATION_END_TIME,
  ASSISTANT_MIN_RESERVATION_START_TIME,
  appendAdjustmentNotesToSummary,
  clampAssistantReservationEndTime,
  clampAssistantReservationStartTime,
  clampReservationPayload,
  clampReservationPayloadEndTimes,
} from "./clamp-reservation-end-time";
import { evaluateQueuedAction } from "./assistant-action-queue";

describe("clampAssistantReservationEndTime", () => {
  it("22:00 이하는 그대로 둔다", () => {
    expect(clampAssistantReservationEndTime("21:30")).toBe("21:30");
    expect(clampAssistantReservationEndTime("22:00")).toBe("22:00");
  });

  it("22:00을 초과하면 22:00으로 보정한다", () => {
    expect(clampAssistantReservationEndTime("22:30")).toBe(
      ASSISTANT_MAX_RESERVATION_END_TIME,
    );
    expect(clampAssistantReservationEndTime("23:00")).toBe(
      ASSISTANT_MAX_RESERVATION_END_TIME,
    );
  });
});

describe("clampAssistantReservationStartTime", () => {
  it("10:00 미만이면 10:00으로 보정한다", () => {
    expect(clampAssistantReservationStartTime("09:00")).toBe(
      ASSISTANT_MIN_RESERVATION_START_TIME,
    );
    expect(clampAssistantReservationStartTime("09:30")).toBe(
      ASSISTANT_MIN_RESERVATION_START_TIME,
    );
  });

  it("10:00 이상이면 그대로 둔다", () => {
    expect(clampAssistantReservationStartTime("10:00")).toBe("10:00");
    expect(clampAssistantReservationStartTime("17:00")).toBe("17:00");
  });
});

describe("clampReservationPayloadEndTimes", () => {
  it("dayTimes와 단건 endTime을 함께 보정한다", () => {
    expect(
      clampReservationPayloadEndTimes({
        endTime: "23:00",
        dayTimes: [
          { day: "월", startTime: "17:00", endTime: "23:00" },
          { day: "화", startTime: "17:00", endTime: "21:00" },
        ],
      }),
    ).toEqual({
      endTime: "22:00",
      dayTimes: [
        { day: "월", startTime: "17:00", endTime: "22:00" },
        { day: "화", startTime: "17:00", endTime: "21:00" },
      ],
    });
  });
});

describe("clampReservationPayload", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-06T12:00:00+09:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("시작·종료 시간을 예약 가능 범위로 보정한다", () => {
    const result = clampReservationPayload(
      {
        dayTimes: [
          { day: "월", startTime: "09:00", endTime: "11:00" },
          { day: "화", startTime: "20:00", endTime: "23:00" },
        ],
      },
      "RESERVATION_BATCH_CREATE",
    );

    expect(result.blocked).toBeUndefined();
    expect(result.payload.dayTimes).toEqual([
      { day: "월", startTime: "10:00", endTime: "11:00" },
      { day: "화", startTime: "20:00", endTime: "22:00" },
    ]);
    expect(result.adjustments).toEqual(
      expect.arrayContaining([
        "월요일 09:00~11:00 → 10:00~11:00",
        "화요일 20:00~23:00 → 20:00~22:00",
      ]),
    );
  });

  it("오늘부터 기간 예약이면 시작일을 내일로 조정한다", () => {
    const result = clampReservationPayload(
      {
        duration: { startDate: "2026-07-06", endDate: "2026-07-31" },
      },
      "RESERVATION_BATCH_CREATE",
    );

    expect(result.blocked).toBeUndefined();
    expect(result.payload.duration).toEqual({
      startDate: "2026-07-07",
      endDate: "2026-07-31",
    });
    expect(result.adjustments).toContain(
      "오늘은 예약할 수 없어 시작일을 내일로 조정했습니다.",
    );
  });

  it("오늘만 예약 요청이면 차단한다", () => {
    const result = clampReservationPayload(
      {
        duration: { startDate: "2026-07-06", endDate: "2026-07-06" },
      },
      "RESERVATION_BATCH_CREATE",
    );

    expect(result.blocked?.message).toBe(
      "오늘만 예약할 수는 없습니다. 예약은 최소 내일부터 가능합니다.",
    );
  });

  it("단건 예약도 오늘 날짜면 차단한다", () => {
    const result = clampReservationPayload(
      {
        date: "2026-07-06",
        startTime: "17:00",
        endTime: "21:00",
      },
      "CREATE_RESERVATION",
    );

    expect(result.blocked?.message).toBe(
      "오늘만 예약할 수는 없습니다. 예약은 최소 내일부터 가능합니다.",
    );
  });
});

describe("evaluateQueuedAction with reservation constraints", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-06T12:00:00+09:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("오늘 시작 배치 예약은 시작일을 내일로 보정하고 creatorName만 요청한다", () => {
    const evaluated = evaluateQueuedAction({
      id: "action-1",
      type: "RESERVATION_BATCH_CREATE",
      status: "pending",
      missingFields: [],
      missingFieldItems: [],
      attempts: 0,
      payload: {
        dayTimes: [{ day: "월", startTime: "17:00", endTime: "21:00" }],
        duration: { startDate: "2026-07-06", endDate: "2026-07-31" },
        batchReservationOption: {
          reservationType: "REGULAR",
          title: "악반의 정기 연습",
        },
      },
    });

    expect(evaluated.status).toBe("needs_input");
    expect(evaluated.payload).toMatchObject({
      duration: { startDate: "2026-07-07", endDate: "2026-07-31" },
    });
    expect(evaluated.missingFields).toEqual(
      expect.arrayContaining(["batchReservationOption.creatorName"]),
    );
    expect(evaluated.missingFields).not.toContain("duration.startDate");
    expect(evaluated.adjustmentNotes).toContain(
      "오늘은 예약할 수 없어 시작일을 내일로 조정했습니다.",
    );
  });
});

describe("appendAdjustmentNotesToSummary", () => {
  it("보정 내역을 summary에 덧붙인다", () => {
    expect(
      appendAdjustmentNotesToSummary("예약을 생성합니다.", [
        "월요일 09:00~11:00 → 10:00~11:00",
      ]),
    ).toContain("예약 가능 범위에 맞게 조정");
  });
});
