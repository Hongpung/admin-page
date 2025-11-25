import { describe, expect, it } from "vitest";
import { formattingReservationsForTable } from "./format-weekly-reservations";
import type { DateReservation } from "../types";

const baseReservation: DateReservation = {
  reservationId: 146,
  date: "2026-05-28",
  startTime: "15:30",
  endTime: "16:30",
  title: "강윤호의 연습",
  reservationType: "COMMON",
  participationAvailable: false,
  creatorName: "강윤호",
  creatorNickname: "",
  amountOfParticipators: 2,
};

describe("formattingReservationsForTable", () => {
  it("maps non-30-minute start times to the containing half-hour slot", () => {
    const map = formattingReservationsForTable([baseReservation]);

    expect(map["목"]).toBeDefined();
    expect(map["목"]["15:30"]).toMatchObject({
      isStart: true,
      isEnd: false,
    });
    expect(map["목"]["16:00"]).toMatchObject({
      isStart: false,
      isEnd: true,
    });
    expect(map["목"]["15:00"]).toBeUndefined();
  });

  it("still maps exact 30-minute boundaries", () => {
    const map = formattingReservationsForTable([
      {
        ...baseReservation,
        startTime: "15:00",
        endTime: "16:30",
      },
    ]);

    expect(map["목"]["15:00"]?.isStart).toBe(true);
    expect(map["목"]["15:30"]?.isEnd).toBe(false);
    expect(map["목"]["16:00"]?.isEnd).toBe(true);
  });

  it("includes the last slot when end time falls between boundaries", () => {
    const map = formattingReservationsForTable([
      {
        ...baseReservation,
        startTime: "16:00",
        endTime: "16:30",
      },
    ]);

    expect(map["목"]["16:00"]?.isStart).toBe(true);
    expect(map["목"]["16:30"]?.isEnd).toBe(true);
  });
});
