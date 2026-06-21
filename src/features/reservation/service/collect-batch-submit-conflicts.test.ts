import { describe, expect, it } from "vitest";
import { collectBatchSubmitConflicts } from "./collect-batch-submit-conflicts";
import type { BatchReservationDto } from "../types/schemas";
import type { ExistReservation } from "../types";

const payload: BatchReservationDto = {
  dayTimes: [{ day: "월", startTime: "18:00", endTime: "20:00" }],
  duration: {
    startDate: "2026-07-06",
    endDate: "2026-07-13",
  },
  batchReservationOption: {
    title: "정기 연습",
    reservationType: "REGULAR",
    creatorId: 1,
  },
};

describe("collect-batch-submit-conflicts", () => {
  it("returns overlapping reservations across matching weekdays in range", () => {
    const reservationsByDate: Record<string, ExistReservation[]> = {
      "2026-07-06": [
        {
          reservationId: 10,
          creatorName: "A팀",
          startTime: "18:30",
          endTime: "19:30",
          title: "기존 연습",
          reservationType: "COMMON",
        },
      ],
      "2026-07-13": [
        {
          reservationId: 11,
          creatorName: "B팀",
          startTime: "17:30",
          endTime: "18:30",
          title: "다른 연습",
          reservationType: "COMMON",
        },
      ],
    };

    const conflicts = collectBatchSubmitConflicts(payload, reservationsByDate);

    expect(conflicts).toHaveLength(2);
    expect(conflicts[0]).toMatchObject({
      reservationId: 10,
      date: "2026-07-06",
    });
    expect(conflicts[1]).toMatchObject({
      reservationId: 11,
      date: "2026-07-13",
    });
  });

  it("ignores non-matching weekdays", () => {
    const reservationsByDate: Record<string, ExistReservation[]> = {
      "2026-07-07": [
        {
          reservationId: 20,
          creatorName: "C팀",
          startTime: "18:00",
          endTime: "19:00",
          title: "화요일 연습",
          reservationType: "COMMON",
        },
      ],
    };

    expect(collectBatchSubmitConflicts(payload, reservationsByDate)).toEqual([]);
  });
});
