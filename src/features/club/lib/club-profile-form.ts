import { z } from "zod";
import type { KoRole } from "../types";

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

const roleAssignmentsSchema = z.record(
  z.string(),
  z.number().int().positive().nullable(),
);

const clubProfileFormSchema = z.object({
  profileImageUrl: z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }, z.url("프로필 이미지 URL이 올바르지 않습니다.").nullable()),
  profileImageFile: z
    .custom<File | null>((value) => value === null || value instanceof File)
    .superRefine((file, ctx) => {
      if (!(file instanceof File)) return;

      if (file.size <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "업로드할 이미지를 선택해 주세요.",
          path: ["profileImageFile"],
        });
      }

      if (!file.type.startsWith("image/")) {
        ctx.addIssue({
          code: "custom",
          message: "이미지 파일만 업로드할 수 있습니다.",
          path: ["profileImageFile"],
        });
      }

      if (file.size > MAX_PROFILE_IMAGE_SIZE) {
        ctx.addIssue({
          code: "custom",
          message: "프로필 이미지는 5MB 이하로 업로드해 주세요.",
          path: ["profileImageFile"],
        });
      }
    }),
  roleAssignments: roleAssignmentsSchema,
});

export function clubProfileFormFirstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "입력값을 확인해 주세요.";
}

export function parseClubProfileForm(data: {
  profileImageUrl: string | null;
  profileImageFile: File | null;
  roleAssignments: Partial<Record<KoRole, number | null>>;
}) {
  return clubProfileFormSchema.safeParse({
    profileImageUrl: data.profileImageUrl,
    profileImageFile: data.profileImageFile,
    roleAssignments: data.roleAssignments,
  });
}
