import { z } from "zod";
import { MANAGE_USER_CLUB_OPTIONS } from "../constants";
import type { MemberListItemResDto, UpdateMemberByAdminReqDto } from "../types";

type EditableUserSnapshot = Pick<
  MemberListItemResDto,
  "name" | "nickname" | "club" | "email"
>;

export type ManageUserAdminUpdateFormValues = {
  name: string;
  nickname: string;
  clubId: string;
  email: string;
};

type BuildManageUserAdminUpdateRequestArgs = {
  user: EditableUserSnapshot | null;
  formValues: ManageUserAdminUpdateFormValues;
};

type ManageUserSensitiveFieldArgs = {
  user: Pick<MemberListItemResDto, "email" | "club"> | null;
  nextEmail: string;
  nextClubIdInput: string;
};

const CLUB_ID_BY_NAME = new Map<string, number>(
  MANAGE_USER_CLUB_OPTIONS.filter((option) => option.value !== "none").map(
    (option) => [option.label, Number(option.value)],
  ),
);

const clubIdInputSchema = z.union([
  z.literal("none"),
  z.string().regex(/^\d+$/, "소속 동아리 값을 다시 선택해주세요."),
]);

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function toClubIdInputValue(clubId: number | null): string {
  return clubId === null ? "none" : String(clubId);
}

export function parseManageUserClubIdInput(clubIdInput: string): number | null {
  if (clubIdInput === "none") return null;
  const parsed = Number(clubIdInput);
  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

export function resolveManageUserClubId(
  user: Pick<MemberListItemResDto, "club"> | null,
): number | null {
  if (!user) return null;

  const clubName = normalizeOptionalText(user.club);
  if (!clubName) return null;

  return CLUB_ID_BY_NAME.get(clubName) ?? null;
}

export function isManageUserSensitiveFieldChanged({
  user,
  nextEmail,
  nextClubIdInput,
}: ManageUserSensitiveFieldArgs): boolean {
  if (!user) return false;

  const currentEmail = user.email.trim();
  const currentClubId = resolveManageUserClubId(user);
  const nextClubId = parseManageUserClubIdInput(nextClubIdInput);

  return currentEmail !== nextEmail.trim() || currentClubId !== nextClubId;
}

export function createManageUserAdminUpdateFormSchema() {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, "이름을 입력해주세요."),
    nickname: z.string(),
    clubId: clubIdInputSchema,
    email: z
      .string()
      .trim()
      .min(1, "로그인 이메일을 입력해주세요.")
      .email("올바른 이메일 형식을 입력해주세요."),
  });
}

export function createManageUserAdminUpdateDefaultValues(
  user: EditableUserSnapshot | null,
): ManageUserAdminUpdateFormValues {
  return {
    name: user?.name ?? "",
    nickname: user?.nickname ?? "",
    clubId: toClubIdInputValue(resolveManageUserClubId(user)),
    email: user?.email ?? "",
  };
}

export function buildManageUserAdminUpdateRequest({
  user,
  formValues,
}: BuildManageUserAdminUpdateRequestArgs): {
  payload: UpdateMemberByAdminReqDto;
  hasChanges: boolean;
  requiresAdminPassword: boolean;
} {
  const payload: UpdateMemberByAdminReqDto = {};
  if (!user) {
    return { payload, hasChanges: false, requiresAdminPassword: false };
  }

  let hasChanges = false;

  const currentName = user.name.trim();
  const nextName = formValues.name.trim();
  if (currentName !== nextName) {
    payload.name = nextName;
    hasChanges = true;
  }

  const currentNickname = normalizeOptionalText(user.nickname);
  const nextNickname = normalizeOptionalText(formValues.nickname);
  if (currentNickname !== nextNickname) {
    payload.nickname = nextNickname;
    hasChanges = true;
  }

  const currentClubId = resolveManageUserClubId(user);
  const nextClubId = parseManageUserClubIdInput(formValues.clubId);
  const clubChanged = currentClubId !== nextClubId;
  if (clubChanged) {
    payload.clubId = nextClubId;
    hasChanges = true;
  }

  const currentEmail = user.email.trim();
  const nextEmail = formValues.email.trim();
  const emailChanged = currentEmail !== nextEmail;
  if (emailChanged) {
    payload.email = nextEmail;
    hasChanges = true;
  }

  const requiresAdminPassword = clubChanged || emailChanged;

  return { payload, hasChanges, requiresAdminPassword };
}
