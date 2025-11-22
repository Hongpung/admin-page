import { queryOptions } from "@tanstack/react-query";
import { loadNotices, loadSpecificNotice } from "../api/notice-api";
import type { Notice } from "../types";

export const noticeQueryKeys = {
  all: ["notice"] as const,
  list: () => [...noticeQueryKeys.all, "list"] as const,
  detail: (noticeId: number) =>
    [...noticeQueryKeys.all, "detail", noticeId] as const,
};

export function noticeListQueryOptions() {
  return queryOptions<Notice[]>({
    queryKey: noticeQueryKeys.list(),
    queryFn: async () => loadNotices(),
  });
}

export function noticeDetailQueryOptions(noticeId: number) {
  return queryOptions<Notice>({
    queryKey: noticeQueryKeys.detail(noticeId),
    queryFn: async () => loadSpecificNotice(noticeId),
    enabled: Number.isFinite(noticeId) && noticeId > 0,
  });
}
