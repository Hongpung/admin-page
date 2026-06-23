import { describe, expect, it } from "vitest";
import { normalizeReservationBatchPayload } from "./normalize-reservation-batch-payload";

describe("normalizeReservationBatchPayload", () => {
  it("moves flat batch fields into batchReservationOption and strips notice fields", () => {
    const normalized = normalizeReservationBatchPayload({
      dayTimes: [{ day: "목", startTime: "15:00", endTime: "17:00" }],
      duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
      noticeAll: false,
      participationAvailable: false,
      reservationType: "REGULAR",
      title: "D503 하계 방학 정기 예약: 와우풍물패 악반 외 3팀 (2026-07-20~2026-08-31)",
    });

    expect(normalized).toEqual({
      dayTimes: [{ day: "목", startTime: "15:00", endTime: "17:00" }],
      duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
      batchReservationOption: {
        reservationType: "REGULAR",
      },
    });
    expect(normalized).not.toHaveProperty("noticeAll");
    expect(normalized).not.toHaveProperty("participationAvailable");
    expect(normalized).not.toHaveProperty("title");
  });

  it("keeps a proper club title and removes polluted summary titles", () => {
    const normalized = normalizeReservationBatchPayload({
      dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
      duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
      batchReservationOption: {
        clubName: "신소재·화학공학과 학회 신명화랑",
        reservationType: "REGULAR",
      },
      title: "D503 하계 방학 정기 예약: 와우풍물패 악반 외 3팀",
    });

    expect(normalized.batchReservationOption).toMatchObject({
      title: "신소재·화학공학과 학회 신명화랑의 정기 연습",
      reservationType: "REGULAR",
      clubName: "신소재·화학공학과 학회 신명화랑",
    });
  });

  it("clamps endTime above 22:00 to 22:00", () => {
    const normalized = normalizeReservationBatchPayload({
      dayTimes: [
        { day: "화", startTime: "17:00", endTime: "23:00" },
        { day: "수", startTime: "17:00", endTime: "22:00" },
      ],
      duration: { startDate: "2026-09-01", endDate: "2026-12-06" },
      batchReservationOption: {
        title: "들녘의 정기 연습",
        reservationType: "REGULAR",
        creatorId: 53,
      },
    });

    expect(normalized.dayTimes).toEqual([
      { day: "화", startTime: "17:00", endTime: "22:00" },
      { day: "수", startTime: "17:00", endTime: "22:00" },
    ]);
  });
});
