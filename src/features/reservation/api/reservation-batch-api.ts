import {
  batchReservationDtoSchema,
  reservationZodFirstMessage,
} from "../types/schemas";

export async function addBatchReservation(batchReservationDTO: unknown) {
  const parsed = batchReservationDtoSchema.safeParse(batchReservationDTO);
  if (!parsed.success) {
    throw new Error(reservationZodFirstMessage(parsed.error));
  }

  const response = await fetch(`/api/reservation/regular/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(parsed.data),
  });

  if (!response.ok) {
    throw new Error("서버 status:" + response.statusText);
  }

  return true;
}

export default addBatchReservation;
