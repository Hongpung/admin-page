import { z } from "zod";

function formString(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function formFile(formData: FormData, key: string): File | null {
  const v = formData.get(key);
  return v instanceof File ? v : null;
}

export function bannerFormFirstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "입력을 확인해주세요";
}

type FormRefinementCtx = {
  addIssue: (issue: {
    code: "custom";
    message: string;
    path: (string | number)[];
  }) => void;
};

function refineHrefAndDates(
  data: { href: string; startDate: string; endDate: string },
  ctx: FormRefinementCtx
) {
  const href = data.href.trim();
  if (href !== "") {
    const r = z.string().url().safeParse(href);
    if (!r.success) {
      ctx.addIssue({
        code: "custom",
        message: "올바른 URL을 입력해주세요",
        path: ["href"],
      });
    }
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  if (Number.isNaN(start.getTime())) {
    ctx.addIssue({
      code: "custom",
      message: "시작 날짜가 올바르지 않습니다",
      path: ["startDate"],
    });
    return;
  }
  if (Number.isNaN(end.getTime())) {
    ctx.addIssue({
      code: "custom",
      message: "종료 날짜가 올바르지 않습니다",
      path: ["endDate"],
    });
    return;
  }
  if (start > end) {
    ctx.addIssue({
      code: "custom",
      message: "날짜를 다시 확인해주세요",
      path: ["endDate"],
    });
  }
  if (end < new Date()) {
    ctx.addIssue({
      code: "custom",
      message: "날짜를 다시 확인해주세요",
      path: ["endDate"],
    });
  }
}

export const bannerCreateFormSchema = z
  .object({
    owner: z.string().trim().min(1, "신청자를 입력해주세요"),
    startDate: z.string().min(1, "시작 날짜를 선택해주세요"),
    endDate: z.string().min(1, "종료 날짜를 선택해주세요"),
    href: z.string().default(""),
    bannerImg: z
      .instanceof(File)
      .refine((f) => f.size > 0, "배너 이미지를 선택해주세요"),
  })
  .superRefine((data, ctx) => refineHrefAndDates(data, ctx))
  .transform((data) => ({
    owner: data.owner.trim(),
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    href: data.href.trim() === "" ? undefined : data.href.trim(),
    bannerImg: data.bannerImg,
  }));

export function parseBannerCreateForm(formData: FormData) {
  return bannerCreateFormSchema.safeParse({
    owner: formString(formData, "owner"),
    startDate: formString(formData, "startDate"),
    endDate: formString(formData, "endDate"),
    href: formString(formData, "banner-href"),
    bannerImg: formFile(formData, "banner-image"),
  });
}

export function parseBannerUpdateForm(
  formData: FormData,
  updatedPart: Record<string, boolean>
) {
  return z
    .object({
      owner: z.string().trim().min(1, "신청자를 입력해주세요"),
      startDate: z.string().min(1, "시작 날짜를 선택해주세요"),
      endDate: z.string().min(1, "종료 날짜를 선택해주세요"),
      href: z.string().default(""),
      bannerImg: z.custom<File | null>(
        (v) => v === null || v instanceof File
      ),
    })
    .superRefine((data, ctx) => {
      if (updatedPart["banner-image"]) {
        if (!(data.bannerImg instanceof File) || data.bannerImg.size === 0) {
          ctx.addIssue({
            code: "custom",
            message: "배너 이미지를 선택해주세요",
            path: ["bannerImg"],
          });
        }
      }
      refineHrefAndDates(data, ctx);
    })
    .transform((data) => ({
      owner: data.owner.trim(),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      href: data.href.trim() === "" ? undefined : data.href.trim(),
      bannerImg: data.bannerImg,
    }))
    .safeParse({
      owner: formString(formData, "owner"),
      startDate: formString(formData, "startDate"),
      endDate: formString(formData, "endDate"),
      href: formString(formData, "banner-href"),
      bannerImg: formFile(formData, "banner-image"),
    });
}
