import type { DiscardedReservationListResponse } from "../types";
import type { SearchMembersResponse } from "../types";
import type { ReservationDetailForEdit } from "../types/schemas";
import {
  reservationDetailForEditSchema,
  reservationZodFirstMessage,
} from "../types/schemas";

interface BriefReservationForCalendar {
  reservationId: number;
  date: string;
  reservationType: "REGULAR" | "COMMON" | "EXTERNAL";
  participationAvailable: boolean;
}

function extractArrayPayload<T>(
  payload: unknown,
  candidateKeys: readonly string[],
): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  for (const key of candidateKeys) {
    const value = data[key];
    if (Array.isArray(value)) return value as T[];
  }

  return [];
}

export type MonthlyCalendarReservations = Record<
  number,
  {
    participationAvailable: boolean;
    reservationType: string;
    reservationId: number;
  }[]
>;

export async function loadDailyReservationsByDateString(date: string) {
  try {
    const response = await fetch(`/api/reservation/live/date?date=${date}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("서버 status:" + response.statusText);
    }

    const payload = (await response.json()) as unknown;
    return extractArrayPayload(payload, ["reservations", "items", "data"]);
  } catch {
    return [];
  }
}

export async function loadDailyReservations(date: Date) {
  return loadDailyReservationsByDateString(
    `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`,
  );
}

export async function loadDailyOccupiedTimes(date: Date) {
  try {
    const response = await fetch(
      `/api/reservation/live/date/occupied?date=${date.getFullYear()}-${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`,
      {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("서버 status:" + response.statusText);
    }

    const payload = (await response.json()) as unknown;
    return extractArrayPayload(payload, ["reservations", "items", "data"]);
  } catch {
    return [];
  }
}

export async function loadReservationDetail(
  reservationId: number,
): Promise<ReservationDetailForEdit> {
  const response = await fetch(
    `/api/reservation/live/reserve?reservationId=${reservationId}`,
    {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("서버 status:" + response.statusText);
  }

  const data: unknown = await response.json();
  const parsed = reservationDetailForEditSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(reservationZodFirstMessage(parsed.error));
  }

  return parsed.data;
}

export async function searchMembers({
  username,
  clubId,
  role,
  page = 0,
  pageSize = 20,
}: {
  username?: string;
  clubId?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}): Promise<SearchMembersResponse> {
  try {
    const query = new URLSearchParams();
    if (username && username.trim() !== "") query.set("username", username);
    if (clubId) query.set("clubId", clubId);
    if (role) query.set("role", role);
    query.set("page", String(page));
    query.set("pageSize", String(pageSize));

    const response = await fetch(
      `/api/reservation/live/member/search?${query.toString()}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("서버 status:" + response.statusText);
    }

    const payload = (await response.json()) as unknown;

    if (Array.isArray(payload)) {
      return {
        members: payload,
        total: payload.length,
        page,
        pageSize,
      } as SearchMembersResponse;
    }

    const data = payload as {
      members?: unknown;
      total?: unknown;
      count?: unknown;
      totalCount?: unknown;
      page?: unknown;
      pageSize?: unknown;
    };

    const members = Array.isArray(data?.members) ? data.members : [];
    const totalCandidate =
      typeof data?.total === "number"
        ? data.total
        : typeof data?.count === "number"
          ? data.count
          : typeof data?.totalCount === "number"
            ? data.totalCount
            : members.length;

    return {
      members,
      total: totalCandidate,
      page: typeof data?.page === "number" ? data.page : page,
      pageSize: typeof data?.pageSize === "number" ? data.pageSize : pageSize,
    } as SearchMembersResponse;
  } catch {
    return {
      members: [],
      total: 0,
      page,
      pageSize,
    };
  }
}

export async function loadWeeklyReservations(
  startDate: string,
  endDate: string,
) {
  try {
    const response = await fetch(
      `/api/reservation/live/reserve/week?start-date=${startDate}&end-date=${endDate}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("서버 status:" + response.statusText);
    }

    const payload = (await response.json()) as unknown;
    return extractArrayPayload(payload, ["reservations", "items", "data"]);
  } catch {
    return [];
  }
}

export async function loadMonthlyReserves(calendar: {
  year: number;
  month: number;
}): Promise<MonthlyCalendarReservations | undefined> {
  try {
    const response = await fetch(
      `/api/reservation/live/calendar?year=${calendar.year}&month=${calendar.month}`,
      {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("서버 status:" + response.statusText);
    }

    const payload = (await response.json()) as unknown;
    const data = extractArrayPayload<BriefReservationForCalendar>(payload, [
      "reservations",
      "items",
      "data",
    ]);
    const filteredData: MonthlyCalendarReservations = {};

    data.forEach((reservation) => {
      const reserveDate = new Date(reservation.date).getDate();
      const entry = {
        reservationId: reservation.reservationId,
        reservationType: reservation.reservationType,
        participationAvailable: reservation.participationAvailable,
      };
      if (!filteredData[reserveDate]) filteredData[reserveDate] = [entry];
      else filteredData[reserveDate] = [...filteredData[reserveDate], entry];
    });

    return filteredData;
  } catch {
    return undefined;
  }
}

export async function loadDiscardedReservations(
  skip = 0,
  take = 20,
): Promise<DiscardedReservationListResponse> {
  const response = await fetch(
    `/api/reservation/discarded/load?skip=${skip}&take=${take}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("서버 status:" + response.statusText);
  }

  return (await response.json()) as DiscardedReservationListResponse;
}
