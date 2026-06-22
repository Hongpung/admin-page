import { z } from "zod";
import { dateYmdSchema } from "@admin/features/reservation/types/schemas";

export const noticeCreateArgsSchema = z.object({
  title: z.string().trim().min(1, "공지 제목을 입력해주세요"),
  content: z.string().trim().min(1, "공지 내용을 입력해주세요"),
  noticeAll: z.boolean().optional(),
  channel: z.number().int().positive().optional(),
});

export const noticeUpdateArgsSchema = z
  .object({
    noticeId: z.number().int().positive("공지 ID가 필요합니다"),
    title: z.string().trim().min(1).optional(),
    content: z.string().trim().min(1).optional(),
    noticeAll: z.boolean().optional(),
    channel: z.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    const hasPatch =
      value.title !== undefined ||
      value.content !== undefined ||
      value.noticeAll !== undefined ||
      value.channel !== undefined;
    if (!hasPatch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "수정할 필드를 한 개 이상 지정해주세요",
        path: ["title"],
      });
    }
  });

export const noticeDeleteArgsSchema = z.object({
  noticeId: z.number().int().positive("삭제할 공지 ID가 필요합니다"),
});

export const bannerCreateArgsSchema = z.object({
  owner: z.string().trim().min(1, "배너 소유자(표시명)를 입력해주세요"),
  bannerImgUrl: z.string().trim().min(1, "배너 이미지 URL이 필요합니다"),
  startDate: dateYmdSchema,
  endDate: dateYmdSchema,
  href: z.string().trim().optional(),
});

export const bannerUpdateArgsSchema = z
  .object({
    bannerId: z.number().int().positive("배너 ID가 필요합니다"),
    owner: z.string().trim().min(1).optional(),
    bannerImgUrl: z.string().trim().min(1).optional(),
    startDate: dateYmdSchema.optional(),
    endDate: dateYmdSchema.optional(),
    href: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    const hasPatch =
      value.owner !== undefined ||
      value.bannerImgUrl !== undefined ||
      value.startDate !== undefined ||
      value.endDate !== undefined ||
      value.href !== undefined;
    if (!hasPatch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "수정할 필드를 한 개 이상 지정해주세요",
        path: ["owner"],
      });
    }
  });

export const bannerDeleteArgsSchema = z.object({
  bannerId: z.number().int().positive("삭제할 배너 ID가 필요합니다"),
});
