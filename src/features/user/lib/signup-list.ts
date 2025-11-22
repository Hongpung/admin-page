import type { SignupListResDto } from "../types";

export function normalizeSignupList(raw: unknown): SignupListResDto[] {
  return Array.isArray(raw) ? (raw as SignupListResDto[]) : [];
}
