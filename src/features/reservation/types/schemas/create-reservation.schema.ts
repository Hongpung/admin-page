import { z } from "zod";
import {
  createEditReservationBaseSchema,
  dateYmdSchema,
  reservationTypeSchema,
  timeFormatSchema,
} from "./common.schema";

export const reservationFormSchema = z
  .object({
    title: z.string().trim().min(1, "연습 내용을 입력해주세요"),
    date: dateYmdSchema,
    startTime: timeFormatSchema.optional(),
    endTime: timeFormatSchema.optional(),
    reservationType: reservationTypeSchema,
    participationAvailable: z.boolean(),
    creatorId: z.number().int().positive().optional(),
    externalCreatorName: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "시작 시간을 선택해주세요",
        path: ["startTime"],
      });
    }
    if (!value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "종료 시간을 선택해주세요",
        path: ["endTime"],
      });
    }

    if (value.reservationType === "EXTERNAL") {
      if (!value.externalCreatorName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "외부 예약자 이름을 입력해주세요",
          path: ["externalCreatorName"],
        });
      }
      return;
    }

    if (value.creatorId == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "예약자를 선택해주세요",
        path: ["creatorId"],
      });
    }
  });

export type ReservationFormValues = z.infer<typeof reservationFormSchema>;

export const createReservationPayloadSchema = z.union([
  createEditReservationBaseSchema.extend({
    reservationType: z.literal("EXTERNAL"),
    externalCreatorName: z.string().min(1, "외부 예약자 이름을 입력해주세요"),
  }),
  createEditReservationBaseSchema.extend({
    reservationType: z.enum(["COMMON", "REGULAR"]),
    creatorId: z.number().int().positive("예약자를 선택해주세요"),
  }),
]);

export type CreateReservationPayload = z.infer<
  typeof createReservationPayloadSchema
>;
