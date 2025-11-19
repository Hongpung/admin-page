import type { MonthlyCalendarReservations } from "../api/reservation-read-api";

type CalendarReservation = NonNullable<MonthlyCalendarReservations[number]>[number];

export function getCalendarReservationDotColor(
  reservation: Pick<
    CalendarReservation,
    "reservationType" | "participationAvailable"
  >,
): string {
  if (reservation.reservationType === "REGULAR") return "bg-blue-500";
  if (reservation.reservationType === "EXTERNAL") return "bg-gray-500";
  return reservation.participationAvailable ? "bg-green-500" : "bg-red-500";
}

export function getCalendarMoreCount(
  reservations: CalendarReservation[] | undefined,
  visibleCount = 3,
): number {
  return Math.max((reservations?.length ?? 0) - visibleCount, 0);
}
