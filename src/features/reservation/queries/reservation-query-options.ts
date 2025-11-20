import { queryOptions } from "@tanstack/react-query";
import {
  loadDailyOccupiedTimes,
  loadDailyReservationsByDateString,
  loadDiscardedReservations,
  loadMonthlyReserves,
  loadReservationDetail,
  loadWeeklyReservations,
  searchMembers,
} from "../api/reservation-api";
import type {
  DateReservation,
  DiscardedReservationListResponse,
  SearchMembersResponse,
} from "../types";
import type { ReservationDetailForEdit } from "../types/schemas";
import type { MonthlyCalendarReservations } from "../api/reservation-read-api";

export const reservationQueryKeys = {
  all: ["reservation"] as const,
  daily: (date: string) => [...reservationQueryKeys.all, "daily", date] as const,
  occupied: (dateKey: string) =>
    [...reservationQueryKeys.all, "occupied", dateKey] as const,
  monthly: (year: number, month: number) =>
    [...reservationQueryKeys.all, "monthly", year, month] as const,
  detail: (reservationId: number) =>
    [...reservationQueryKeys.all, "detail", reservationId] as const,
  discarded: (skip: number, take: number) =>
    [...reservationQueryKeys.all, "discarded", skip, take] as const,
  memberSearch: (params: {
    username?: string;
    clubId?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  }) =>
    [
      ...reservationQueryKeys.all,
      "memberSearch",
      params.username ?? "",
      params.clubId ?? "",
      params.role ?? "",
      params.page ?? 0,
      params.pageSize ?? 20,
    ] as const,
  weekly: (startOfWeek: string, endOfWeek: string) =>
    [...reservationQueryKeys.all, "weekly", startOfWeek, endOfWeek] as const,
};

export function dailyReservationsQueryOptions(date: string) {
  return queryOptions({
    queryKey: reservationQueryKeys.daily(date),
    queryFn: async () => loadDailyReservationsByDateString(date),
  });
}

export function dailyOccupiedTimesQueryOptions(date: Date) {
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
  return queryOptions({
    queryKey: reservationQueryKeys.occupied(dateKey),
    queryFn: async () => loadDailyOccupiedTimes(date),
  });
}

export function monthlyReservationsQueryOptions(calendar: {
  year: number;
  month: number;
}) {
  return queryOptions<MonthlyCalendarReservations | undefined>({
    queryKey: reservationQueryKeys.monthly(calendar.year, calendar.month),
    queryFn: async () => loadMonthlyReserves(calendar),
  });
}

export function reservationDetailQueryOptions(reservationId: number) {
  return queryOptions<ReservationDetailForEdit>({
    queryKey: reservationQueryKeys.detail(reservationId),
    queryFn: async () => loadReservationDetail(reservationId),
    enabled: Number.isFinite(reservationId) && reservationId > 0,
  });
}

export function discardedReservationsQueryOptions(skip = 0, take = 20) {
  return queryOptions<DiscardedReservationListResponse>({
    queryKey: reservationQueryKeys.discarded(skip, take),
    queryFn: async () => loadDiscardedReservations(skip, take),
  });
}

export function reservationMemberSearchQueryOptions(params: {
  username?: string;
  clubId?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}) {
  return queryOptions<SearchMembersResponse>({
    queryKey: reservationQueryKeys.memberSearch(params),
    queryFn: async () =>
      searchMembers({
        username: params.username,
        clubId: params.clubId,
        role: params.role,
        page: params.page,
        pageSize: params.pageSize,
      }),
  });
}

export function weeklyReservationsQueryOptions(
  startOfWeek: string,
  endOfWeek: string,
) {
  return queryOptions<DateReservation[]>({
    queryKey: reservationQueryKeys.weekly(startOfWeek, endOfWeek),
    queryFn: async () => {
      const data = await loadWeeklyReservations(startOfWeek, endOfWeek);
      return (data as DateReservation[] | undefined) ?? [];
    },
    refetchOnWindowFocus: false,
  });
}
