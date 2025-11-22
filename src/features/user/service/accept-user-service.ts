import type { SignUpRequestUser } from "../types";
import { acceptUsers } from "../api/accept-api";

export async function acceptSignupRequests(signupIds: number[]): Promise<void> {
  await acceptUsers(signupIds);
}

export function toUserActionErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "요청 처리 중 알 수 없는 오류가 발생했습니다.";
}

export function removeAcceptedSignups(
  users: SignUpRequestUser[] | undefined,
  acceptedIds: number[],
) {
  return (users ?? []).filter((u) => !acceptedIds.includes(u.signupId));
}
