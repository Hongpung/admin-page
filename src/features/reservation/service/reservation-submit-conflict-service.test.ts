import { describe, expect, it } from "vitest";
import { collectSubmitConflicts } from "./reservation-submit-conflict-service";
import type { ReservationFormValues } from "../types/schemas";
import type { ExistReservation } from "../types";

const baseValues: ReservationFormValues = {
  title: "연습",
  date: "2026-05-01",
  startTime: "10:30",
  endTime: "11:30",
  reservationType: "COMMON",
  participationAvailable: true,
  creatorId: 1,
  externalCreatorName: "",
};

const reservations: ExistReservation[] = [
  {
    reservationId: 10,
    creatorName: "홍길동",
    startTime: "10:00",
    endTime: "11:00",
    title: "기존 예약",
    reservationType: "COMMON",
  },
];

describe("reservation-submit-conflict-service", () => {
  it("returns overlapping reservations for submit-time validation", () => {
    expect(collectSubmitConflicts({ values: baseValues, reservations })).toHaveLength(
      1,
    );
  });

  it("excludes the reservation being edited", () => {
    expect(
      collectSubmitConflicts({
        values: baseValues,
        reservations,
        excludeReservationId: 10,
      }),
    ).toEqual([]);
  });
});
