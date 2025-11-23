import type { AdminSimple } from "../types";
import { ADMIN_MANAGE_TEXT } from "../constants";

export function toAdminErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : fallbackMessage;
}

export function levelLabel(level: AdminSimple["adminLevel"]) {
  if (level === "SUPER") return ADMIN_MANAGE_TEXT.levelLabel.super;
  if (level === "SUB") return ADMIN_MANAGE_TEXT.levelLabel.sub;
  return ADMIN_MANAGE_TEXT.levelLabel.empty;
}

export function levelDisplay(level: AdminSimple["adminLevel"]) {
  if (level === "SUPER") return ADMIN_MANAGE_TEXT.levelDisplay.super;
  if (level === "SUB") return ADMIN_MANAGE_TEXT.levelDisplay.sub;
  return ADMIN_MANAGE_TEXT.levelDisplay.empty;
}

export function canPickAdminTarget(
  memberId: number,
  adminMemberIds: Set<number>,
  sessionMemberId: number | null,
) {
  return !adminMemberIds.has(memberId) && memberId !== sessionMemberId;
}
