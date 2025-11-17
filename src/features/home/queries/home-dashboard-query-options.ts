import { queryOptions } from "@tanstack/react-query";
import { loadBanners } from "@admin/features/banner";
import { loadNotices, type Notice } from "@admin/features/notice";
import { loadDiscardedReservations } from "@admin/features/reservation";
import { loadLatestSessionLogs, type Session } from "@admin/features/session";
import { fetchSignupData, normalizeSignupList } from "@admin/features/user";

export const homeDashboardQueryKeys = {
  all: ["home", "dashboard"] as const,
  pendingSignups: () => [...homeDashboardQueryKeys.all, "pendingSignups"] as const,
  weekDiscarded: (take: number) =>
    [...homeDashboardQueryKeys.all, "weekDiscarded", take] as const,
  notices: () => [...homeDashboardQueryKeys.all, "notices"] as const,
  activeBanners: () => [...homeDashboardQueryKeys.all, "activeBanners"] as const,
  recentEndedSessions: (maxCount: number) =>
    [...homeDashboardQueryKeys.all, "recentEndedSessions", maxCount] as const,
};

export function pendingSignupCountQueryOptions() {
  return queryOptions<number>({
    queryKey: homeDashboardQueryKeys.pendingSignups(),
    queryFn: async () => {
      const signupRaw = await fetchSignupData();
      const signupList = normalizeSignupList(signupRaw);
      return signupList.length;
    },
  });
}

export function weekDiscardedReservationsQueryOptions(take: number) {
  return queryOptions({
    queryKey: homeDashboardQueryKeys.weekDiscarded(take),
    queryFn: async () => loadDiscardedReservations(0, take),
  });
}

export function dashboardNoticesQueryOptions() {
  return queryOptions<Notice[]>({
    queryKey: homeDashboardQueryKeys.notices(),
    queryFn: () => loadNotices(),
  });
}

export function activeBannerCountQueryOptions() {
  return queryOptions<number>({
    queryKey: homeDashboardQueryKeys.activeBanners(),
    queryFn: async () => {
      const bannersRes = await loadBanners();
      return bannersRes?.OnPost?.length ?? 0;
    },
  });
}

export function recentEndedSessionsQueryOptions(maxCount: number) {
  return queryOptions<Session[]>({
    queryKey: homeDashboardQueryKeys.recentEndedSessions(maxCount),
    queryFn: async () => {
      const rows = await loadLatestSessionLogs(0);
      return rows.slice(0, maxCount);
    },
  });
}
