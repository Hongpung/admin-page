import type {
  ReservationDetailForEdit,
  ReservationFormValues,
} from "../types/schemas";

export const createReservationDefaultValues: ReservationFormValues = {
  title: "",
  date: "",
  startTime: undefined,
  endTime: undefined,
  reservationType: "COMMON",
  participationAvailable: true,
  creatorId: undefined,
  externalCreatorName: "",
};

export const editReservationDefaultValues: ReservationFormValues = {
  title: "",
  date: "",
  startTime: undefined,
  endTime: undefined,
  reservationType: "COMMON",
  participationAvailable: false,
  creatorId: undefined,
  externalCreatorName: "",
};

export function buildReservationFormValuesFromDetail(
  reservation: ReservationDetailForEdit,
): ReservationFormValues {
  return {
    title: reservation.title,
    date: reservation.date.slice(0, 10),
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    reservationType: reservation.reservationType,
    participationAvailable: reservation.participationAvailable,
    creatorId: reservation.creatorId,
    externalCreatorName:
      reservation.reservationType === "EXTERNAL"
        ? (reservation.creatorName ?? "")
        : "",
  };
}
