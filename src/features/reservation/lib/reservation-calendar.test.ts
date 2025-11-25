import { describe, expect, it } from "vitest";
import {
  getCalendarMoreCount,
  getCalendarReservationDotColor,
} from "./reservation-calendar";

describe("reservation-calendar", () => {
  it("chooses dot colors by reservation type and participation status", () => {
    expect(
      getCalendarReservationDotColor({
        reservationType: "REGULAR",
        participationAvailable: false,
      }),
    ).toBe("bg-blue-500");
    expect(
      getCalendarReservationDotColor({
        reservationType: "EXTERNAL",
        participationAvailable: false,
      }),
    ).toBe("bg-gray-500");
    expect(
      getCalendarReservationDotColor({
        reservationType: "COMMON",
        participationAvailable: true,
      }),
    ).toBe("bg-green-500");
    expect(
      getCalendarReservationDotColor({
        reservationType: "COMMON",
        participationAvailable: false,
      }),
    ).toBe("bg-red-500");
  });

  it("computes hidden reservation count", () => {
    expect(getCalendarMoreCount(undefined)).toBe(0);
    expect(
      getCalendarMoreCount([
        { reservationId: 1, reservationType: "COMMON", participationAvailable: true },
        { reservationId: 2, reservationType: "COMMON", participationAvailable: true },
        { reservationId: 3, reservationType: "COMMON", participationAvailable: true },
        { reservationId: 4, reservationType: "COMMON", participationAvailable: true },
      ]),
    ).toBe(1);
  });
});
