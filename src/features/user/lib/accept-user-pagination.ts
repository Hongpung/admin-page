import type { SignUpRequestUser } from "../types";

export function calculateTotalPages(totalCount: number, take: number): number {
  if (totalCount === 0) return 1;
  return Math.max(1, Math.ceil(totalCount / take));
}

export function clampPage(page: number, totalPages: number): number {
  return Math.min(page, Math.max(0, totalPages - 1));
}

export function getPagedSignupRows(
  rows: SignUpRequestUser[],
  page: number,
  take: number,
) {
  const start = page * take;
  return rows.slice(start, start + take);
}
