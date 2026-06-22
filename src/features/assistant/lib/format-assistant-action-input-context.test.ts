import { describe, expect, it } from "vitest";
import {
  buildInputCardContextConfig,
  formatCreateReservationContextLine,
  formatMissingFieldsContextMessage,
  formatReservationBatchContextLine,
} from "./format-assistant-action-input-context";

describe("formatCreateReservationContextLine", () => {
  it("includes queue position and reservation details", () => {
    const line = formatCreateReservationContextLine(
      {
        date: "2026-07-08",
        startTime: "15:00",
        endTime: "17:00",
        title: "쇠 통합반",
        creatorName: "담당바",
      },
      { index: 8, total: 16, pending: 9 },
    );

    expect(line).toBe(
      "8/16번째 작업 · 2026-07-08 15:00–17:00 · 쇠 통합반 · 담당 담당바",
    );
  });
});

describe("formatMissingFieldsContextMessage", () => {
  it("lists missing fields under reservation context", () => {
    const message = formatMissingFieldsContextMessage(
      "3/16번째 예약 · 2026-07-06 11:00–15:00 · 오금반 · 담당 담당가",
      [
        {
          path: "creatorName",
          label: "예약자 이름",
          message: "「담당가」 검색 결과가 여러 명입니다.",
          display: "",
        },
      ],
    );

    expect(message).toContain("3/16번째 예약");
    expect(message).toContain("이 예약에 아직 필요한 항목:");
    expect(message).toContain("예약자");
  });
});

describe("buildInputCardContextConfig", () => {
  it("returns info widget for CREATE_RESERVATION gaps", () => {
    const config = buildInputCardContextConfig(
      {
        date: "2026-07-07",
        startTime: "11:00",
        endTime: "13:00",
        title: "설장구",
        creatorName: "담당라",
      },
      { index: 3, total: 16, pending: 14 },
      [
        {
          path: "creatorName",
          label: "예약자 이름",
          message: "예약자 이름을 입력해주세요",
          display: "",
        },
      ],
      "CREATE_RESERVATION",
    );

    expect(config?.widget).toBe("info");
    expect(config?.message).toContain("3/16번째 작업");
    expect(config?.message).toContain("설장구");
  });

  it("returns info widget for RESERVATION_BATCH_CREATE gaps", () => {
    const config = buildInputCardContextConfig(
      {
        dayTimes: [
          { day: "월", startTime: "17:00", endTime: "22:00" },
          { day: "금", startTime: "17:00", endTime: "22:00" },
        ],
        duration: { startDate: "2026-09-01", endDate: "2026-12-31" },
        batchReservationOption: {
          title: "악반의 정기 연습",
          clubName: "악반",
          reservationType: "REGULAR",
        },
      },
      { index: 5, total: 8, pending: 4 },
      [
        {
          path: "batchReservationOption.creatorName",
          label: "예약자 이름",
          message: "예약자 이름을 입력해주세요",
          display: "",
        },
      ],
      "RESERVATION_BATCH_CREATE",
    );

    expect(config?.widget).toBe("info");
    expect(config?.message).toContain("5/8번째 작업");
    expect(config?.message).toContain("악반의 정기 연습");
    expect(config?.message).toContain("2026-09-01 ~ 2026-12-31");
    expect(config?.message).toContain("월·금 17:00–22:00");
    expect(config?.message).toContain("이 정기 예약에 아직 필요한 항목");
  });
});

describe("formatReservationBatchContextLine", () => {
  it("summarizes batch reservation target", () => {
    expect(
      formatReservationBatchContextLine(
        {
          dayTimes: [{ day: "화", startTime: "17:00", endTime: "22:00" }],
          duration: { startDate: "2026-09-01", endDate: "2026-12-31" },
          batchReservationOption: { title: "신명화랑의 정기 연습" },
        },
        { index: 2, total: 4, pending: 3 },
      ),
    ).toBe(
      "2/4번째 작업 · 신명화랑의 정기 연습 · 2026-09-01 ~ 2026-12-31 · 화 17:00–22:00",
    );
  });
});
