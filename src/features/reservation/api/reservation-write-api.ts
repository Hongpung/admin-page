import {
  apiMessageResponseSchema,
  createReservationPayloadSchema,
  editReservationPayloadSchema,
  reservationZodFirstMessage,
} from "../types/schemas";

function parseReservationMutationBody(data: unknown) {
  const msg = apiMessageResponseSchema.safeParse(data);
  if (msg.success) return msg.data;
  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof (data as { message: unknown }).message === "string"
  ) {
    return { message: (data as { message: string }).message };
  }
  return { message: "처리되었습니다" };
}

export async function createReservation(createData: unknown) {
  const parsed = createReservationPayloadSchema.safeParse(createData);
  if (!parsed.success)
    throw new Error(reservationZodFirstMessage(parsed.error));

  const response = await fetch(`/api/reservation/live/reserve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("서버 status:" + response.statusText);
  }

  return parseReservationMutationBody(await response.json());
}

export async function editReservation(
  reservationId: number,
  updateData: unknown,
) {
  const parsed = editReservationPayloadSchema.safeParse(updateData);
  if (!parsed.success)
    throw new Error(reservationZodFirstMessage(parsed.error));

  const response = await fetch(
    `/api/reservation/live/reserve?reservationId=${reservationId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("서버 status:" + response.statusText);
  }

  return parseReservationMutationBody(await response.json());
}

export async function deleteReservation(reservationId: number) {
  const response = await fetch(
    `/api/reservation/live/reserve?reservationId=${reservationId}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("서버 status:" + response.statusText);
  }

  return parseReservationMutationBody(await response.json());
}
