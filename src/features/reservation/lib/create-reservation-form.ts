import type { RefObject } from "react";
import type { NewReservation } from "../types";

export function isCreateReservationDirty(
  formRef: RefObject<HTMLFormElement | null>,
  newReservation: NewReservation,
): boolean {
  const practice =
    (
      formRef.current?.elements.namedItem(
        "practice-name",
      ) as HTMLInputElement | null
    )?.value?.trim() ?? "";
  if (practice.length > 0) return true;

  const external =
    (
      formRef.current?.elements.namedItem(
        "external-username",
      ) as HTMLInputElement | null
    )?.value?.trim() ?? "";
  if (external.length > 0) return true;

  if (newReservation.date) return true;
  if (newReservation.startTime) return true;
  if (newReservation.endTime) return true;
  if (newReservation.creatorId != null) return true;
  if (newReservation.reservationType !== "COMMON") return true;
  if (!newReservation.participationAvailable) return true;
  return false;
}

export function buildCreateReservationPayload(
  formData: FormData,
  newReservation: NewReservation,
): Record<string, string | boolean | number | undefined> {
  const title = (formData.get("practice-name") as string)?.trim() ?? "";
  const payload: Record<string, string | boolean | number | undefined> = {
    title,
    date: newReservation.date,
    startTime: newReservation.startTime,
    endTime: newReservation.endTime,
    reservationType: newReservation.reservationType,
    participationAvailable: newReservation.participationAvailable,
  };

  if (newReservation.reservationType === "EXTERNAL") {
    payload.externalCreatorName =
      (formData.get("external-username") as string)?.trim() ?? "";
    return payload;
  }

  if (newReservation.creatorId) {
    payload.creatorId = newReservation.creatorId;
  }

  return payload;
}
