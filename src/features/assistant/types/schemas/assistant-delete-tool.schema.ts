import { z } from "zod";

/** 조회용 날짜 — 생성 제약(내일 이후) 없이 YYYY-MM-DD만 검증 */
export const assistantLookupDateYmdSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 합니다");

export const reservationForceDeleteArgsSchema = z.object({
  reservationId: z.number().int().positive("삭제할 예약 ID가 필요합니다"),
});

export const reservationsBatchDeleteArgsSchema = z.object({
  reservationIds: z
    .array(z.number().int().positive())
    .min(1, "삭제할 예약을 한 개 이상 선택해주세요"),
});

export const reservationsByDateLookupArgsSchema = z.object({
  date: assistantLookupDateYmdSchema,
});

export const reservationsByTermLookupArgsSchema = z.object({
  startDate: assistantLookupDateYmdSchema,
  endDate: assistantLookupDateYmdSchema,
});

export const reservationsByWeekLookupArgsSchema = z.object({
  weekOffset: z.number().int().optional().default(0),
});

export const membersSearchLookupArgsSchema = z.object({
  username: z.string().trim().min(1).optional(),
  clubId: z.number().int().min(0).optional(),
  role: z.string().trim().min(1).optional(),
  page: z.number().int().min(0).optional().default(0),
  pageSize: z.union([z.literal(20), z.literal(40), z.literal(80)]).optional().default(20),
});
