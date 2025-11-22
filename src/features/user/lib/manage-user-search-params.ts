import {
  MANAGE_USER_DEFAULT_PAGE_SIZE,
  MANAGE_USER_PAGE_SIZE_OPTIONS,
} from "../constants/manage-user-page";

export function parseManageUserPageSize(searchParams: URLSearchParams): number {
  const n = Number(
    searchParams.get("pageSize") ?? String(MANAGE_USER_DEFAULT_PAGE_SIZE),
  );
  if (Number.isNaN(n)) return MANAGE_USER_DEFAULT_PAGE_SIZE;
  return MANAGE_USER_PAGE_SIZE_OPTIONS.includes(
    n as (typeof MANAGE_USER_PAGE_SIZE_OPTIONS)[number],
  )
    ? n
    : MANAGE_USER_DEFAULT_PAGE_SIZE;
}

export function applyManageUserSearchParams(
  params: URLSearchParams,
  next: {
    page?: number;
    keyword?: string;
    clubId?: string;
    role?: string;
    pageSize?: number;
  },
) {
  if (next.page !== undefined) {
    params.set("page", String(Math.max(0, next.page)));
  }

  if (next.keyword !== undefined) {
    const trimmed = next.keyword.trim();
    if (trimmed) params.set("keyword", trimmed);
    else params.delete("keyword");
  }

  if (next.clubId !== undefined) {
    if (next.clubId !== "none") params.set("clubId", next.clubId);
    else params.delete("clubId");
  }

  if (next.role !== undefined) {
    if (next.role !== "none") params.set("role", next.role);
    else params.delete("role");
  }

  if (next.pageSize !== undefined) {
    params.set("pageSize", String(next.pageSize));
  }
}
