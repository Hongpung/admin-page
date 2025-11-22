import { deleteUser } from "../api/manage-api";
import type { User } from "../types";

export async function deleteManagedUser(
  user: User,
  adminPassword: string,
): Promise<boolean> {
  const response = await deleteUser(user.memberId, adminPassword);
  return !!response;
}

export function hasAdminPassword(password: string): boolean {
  return password.trim().length > 0;
}

export function toManageUserActionErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallbackMessage;
}
