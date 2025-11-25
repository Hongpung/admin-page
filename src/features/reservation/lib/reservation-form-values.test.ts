import { describe, expect, it } from "vitest";
import { buildReservationFormValuesFromDetail } from "./reservation-form-values";
import type { ReservationDetailForEdit } from "../types/schemas";

describe("reservation-form-values", () => {
  it("maps edit detail to react-hook-form values", () => {
    const detail: ReservationDetailForEdit = {
      reservationId: 1,
      title: "상쇠 연습",
      date: "2026-05-01T00:00:00.000Z",
      startTime: "10:00",
      endTime: "11:00",
      reservationType: "EXTERNAL",
      participationAvailable: false,
      creatorName: "외부팀",
    };

    expect(buildReservationFormValuesFromDetail(detail)).toEqual({
      title: "상쇠 연습",
      date: "2026-05-01",
      startTime: "10:00",
      endTime: "11:00",
      reservationType: "EXTERNAL",
      participationAvailable: false,
      creatorId: undefined,
      externalCreatorName: "외부팀",
    });
  });
});
