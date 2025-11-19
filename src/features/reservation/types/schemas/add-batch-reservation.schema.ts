import { z } from "zod";
import {
  dateYmdSchema,
  parseYmdToLocalDate,
  reservationTypeSchema,
  timeFormatSchema,
  weekDaySchema,
} from "./common.schema";

const batchDayTimeSchema = z.object({
  day: weekDaySchema,
  startTime: timeFormatSchema,
  endTime: timeFormatSchema,
});

const batchDayTimeFormSchema = z.object({
  day: weekDaySchema,
  startTime: timeFormatSchema.optional(),
  endTime: timeFormatSchema.optional(),
});

const batchOptionSchema = z.union([
  z.object({
    title: z.string().min(1, "연습 내용을 입력해주세요"),
    reservationType: z.literal("EXTERNAL"),
    creatorName: z.string().min(1, "외부 예약자를 입력해주세요"),
  }),
  z.object({
    title: z.string().min(1, "연습 내용을 입력해주세요"),
    reservationType: z.enum(["COMMON", "REGULAR"]),
    creatorId: z.number().int().positive("예약자를 선택해주세요"),
  }),
]);

export const batchReservationDtoSchema = z.object({
  dayTimes: z
    .array(batchDayTimeSchema)
    .min(1, "연습 일정을 한 개 이상 추가해주세요"),
  duration: z.object({
    startDate: dateYmdSchema,
    endDate: dateYmdSchema,
  }),
  batchReservationOption: batchOptionSchema,
});

export type BatchReservationDto = z.infer<typeof batchReservationDtoSchema>;

export const addBatchReservationFormSchema = z
  .object({
    title: z.string(),
    reservationType: reservationTypeSchema,
    creatorId: z.number().int().positive().optional(),
    creatorName: z.string(),
    creatorDisplayName: z.string(),
    dayTimes: z.array(batchDayTimeFormSchema),
    startDate: z.string(),
    endDate: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.dayTimes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "연습 일정을 한 개 이상 추가해주세요",
        path: ["dayTimes"],
      });
    }

    value.dayTimes.forEach((dayTime, index) => {
      if (!dayTime.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "시작 시간을 선택해주세요",
          path: ["dayTimes", index, "startTime"],
        });
      }
      if (!dayTime.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "종료 시간을 선택해주세요",
          path: ["dayTimes", index, "endTime"],
        });
      }
    });

    if (value.reservationType === "EXTERNAL") {
      if (!value.creatorName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "외부 예약자를 입력해주세요",
          path: ["creatorName"],
        });
      }
    } else if (value.creatorId == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "예약자를 선택해주세요",
        path: ["creatorId"],
      });
    }

    const startDateResult = dateYmdSchema.safeParse(value.startDate);
    const endDateResult = dateYmdSchema.safeParse(value.endDate);

    if (!value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "시작 날짜를 선택해주세요",
        path: ["startDate"],
      });
    } else if (!startDateResult.success) {
      startDateResult.error.issues.forEach((issue) =>
        ctx.addIssue({ ...issue, path: ["startDate"] }),
      );
    }

    if (!value.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "종료 날짜를 선택해주세요",
        path: ["endDate"],
      });
    } else if (!endDateResult.success) {
      endDateResult.error.issues.forEach((issue) =>
        ctx.addIssue({ ...issue, path: ["endDate"] }),
      );
    }

    const startDate = parseYmdToLocalDate(value.startDate);
    const endDate = parseYmdToLocalDate(value.endDate);

    if (startDate && endDate && startDate >= endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "종료 날짜는 시작 날짜 이후로 선택해주세요",
        path: ["endDate"],
      });
    }
  });

export type AddBatchReservationFormValues = z.infer<
  typeof addBatchReservationFormSchema
>;
