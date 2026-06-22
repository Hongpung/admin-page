import "server-only";

import type { DateReservation } from "@admin/features/reservation/types";
import type { TimeFormat } from "@admin/features/reservation/constants/constants";
import { z } from "zod";

const reservationListItemSchema = z
  .object({
    reservationId: z.number(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    title: z.string(),
    creatorName: z.string(),
    creatorNickname: z.string().nullable().optional(),
    reservationType: z.enum(["REGULAR", "COMMON", "EXTERNAL"]),
    participationAvailable: z.boolean().optional(),
    amountOfParticipators: z.number().optional(),
  })
  .passthrough();

function requireBaseUrl(): string {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("BASE_URL is not configured");
  }
  return baseUrl;
}

function extractReservationList(payload: unknown): DateReservation[] {
  const rawItems = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object"
      ? ((payload as Record<string, unknown>).reservations ??
        (payload as Record<string, unknown>).items ??
        (payload as Record<string, unknown>).data)
      : [];

  if (!Array.isArray(rawItems)) {
    return [];
  }

  const parsed: DateReservation[] = [];
  for (const item of rawItems) {
    const result = reservationListItemSchema.safeParse(item);
    if (!result.success) continue;
    parsed.push({
      ...result.data,
      startTime: result.data.startTime as TimeFormat,
      endTime: result.data.endTime as TimeFormat,
      creatorNickname: result.data.creatorNickname ?? "",
      participationAvailable: result.data.participationAvailable ?? false,
      amountOfParticipators: result.data.amountOfParticipators ?? 0,
    });
  }

  return parsed;
}

export async function fetchAssistantDailyReservations(
  token: string,
  date: string,
): Promise<DateReservation[]> {
  const response = await fetch(
    `${requireBaseUrl()}/reservation/daily?date=${encodeURIComponent(date)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`일별 예약 조회 실패 (${date})`);
  }

  const payload: unknown = await response.json();
  return extractReservationList(payload);
}

export async function fetchAssistantTermReservations(
  token: string,
  startDate: string,
  endDate: string,
): Promise<DateReservation[]> {
  const query = new URLSearchParams({
    "start-date": startDate,
    "end-date": endDate,
  });

  const response = await fetch(
    `${requireBaseUrl()}/reservation/term?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`기간별 예약 조회 실패 (${startDate}~${endDate})`);
  }

  const payload: unknown = await response.json();
  return extractReservationList(payload);
}

export async function fetchAssistantReservationDetail(
  token: string,
  reservationId: number,
): Promise<DateReservation | null> {
  const response = await fetch(
    `${requireBaseUrl()}/reservation/${reservationId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload: unknown = await response.json();
  const list = extractReservationList([payload]);
  return list[0] ?? null;
}
