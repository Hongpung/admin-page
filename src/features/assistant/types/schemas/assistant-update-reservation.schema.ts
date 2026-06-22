import { z } from "zod";
import {
  dateYmdSchema,
  reservationTypeSchema,
  timeFormatSchema,
} from "@admin/features/reservation/types/schemas";

const PATCH_FIELD_KEYS = [
  "title",
  "date",
  "startTime",
  "endTime",
  "reservationType",
  "participationAvailable",
  "creatorId",
  "externalCreatorName",
] as const;

export const reservationUpdateArgsSchema = z
  .object({
    reservationId: z.number().int().positive("예약 ID가 필요합니다"),
    title: z.string().trim().min(1).optional(),
    date: dateYmdSchema.optional(),
    startTime: timeFormatSchema.optional(),
    endTime: timeFormatSchema.optional(),
    reservationType: reservationTypeSchema.optional(),
    participationAvailable: z.boolean().optional(),
    creatorId: z.number().int().positive().optional(),
    externalCreatorName: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    const hasPatch = PATCH_FIELD_KEYS.some(
      (key) => value[key as keyof typeof value] !== undefined,
    );
    if (!hasPatch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "수정할 필드를 한 개 이상 지정해주세요",
        path: ["title"],
      });
    }
  });
