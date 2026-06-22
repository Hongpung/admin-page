import { z } from "zod";
import { createReservationPayloadSchema } from "@admin/features/reservation/types/schemas";

export const reservationsMultiCreateArgsSchema = z.object({
  reservations: z
    .array(createReservationPayloadSchema)
    .min(1, "예약을 한 건 이상 추가해주세요"),
});

export type ReservationsMultiCreateArgs = z.infer<
  typeof reservationsMultiCreateArgsSchema
>;
