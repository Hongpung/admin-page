import { z } from "zod";
import { TimeArray, weekdays_ko } from "../../constants/constants";

export const timeFormatSchema = z.enum(TimeArray);

export const weekDaySchema = z.enum(weekdays_ko);

export const reservationTypeSchema = z.enum(["COMMON", "REGULAR", "EXTERNAL"]);

const DATE_MIN_TOMORROW_MESSAGE =
  "오늘/과거 날짜는 선택할 수 없습니다. 최소 내일 날짜를 선택해주세요";

export function parseYmdToLocalDate(value: string): Date | null {
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function getTomorrowStart(): Date {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

export const dateYmdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다")
  .superRefine((value, ctx) => {
    const parsedDate = parseYmdToLocalDate(value);

    if (!parsedDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "유효한 날짜를 선택해주세요",
      });
      return;
    }

    if (parsedDate < getTomorrowStart()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: DATE_MIN_TOMORROW_MESSAGE,
      });
    }
  });

export const createEditReservationBaseSchema = z.object({
  title: z.string().min(1, "연습 내용을 입력해주세요"),
  date: dateYmdSchema,
  startTime: timeFormatSchema,
  endTime: timeFormatSchema,
  participationAvailable: z.boolean(),
});

export const apiMessageResponseSchema = z
  .object({
    message: z.string(),
  })
  .passthrough();

export function reservationZodFirstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "입력을 확인해주세요";
}
