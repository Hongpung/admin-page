import { z } from "zod";
import {
  createEditReservationBaseSchema,
  reservationTypeSchema,
  timeFormatSchema,
} from "./common.schema";

export const editReservationPayloadSchema = z.union([
  createEditReservationBaseSchema.extend({
    reservationType: z.literal("EXTERNAL"),
    externalCreatorName: z.string().min(1, "외부 예약자 이름을 입력해주세요"),
  }),
  createEditReservationBaseSchema.extend({
    reservationType: z.enum(["COMMON", "REGULAR"]),
    creatorId: z.number().int().positive("예약자를 선택해주세요"),
  }),
]);

export type EditReservationPayload = z.infer<
  typeof editReservationPayloadSchema
>;

export const reservationDetailForEditSchema = z
  .object({
    reservationId: z.coerce.number(),
    date: z.string(),
    participationAvailable: z.boolean(),
    title: z.string(),
    reservationType: reservationTypeSchema,
    creatorId: z.coerce.number().optional(),
    creatorName: z.string().optional(),
    creatorNickname: z.string().optional().nullable(),
    startTime: timeFormatSchema.optional(),
    endTime: timeFormatSchema.optional(),
  })
  .strip();

export type ReservationDetailForEdit = z.infer<
  typeof reservationDetailForEditSchema
>;
