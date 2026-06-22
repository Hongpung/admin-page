import "server-only";

import {
  collectToolDiscardImpact,
  listImpactDates,
  type AssistantToolDiscardImpactItem,
} from "@admin/features/assistant/lib/collect-tool-discard-impact";
import {
  fetchAssistantBannerDetail,
  fetchAssistantNoticeDetail,
} from "@admin/features/assistant/lib/fetch-assistant-manage-lists";
import { getAssistantToolDefinition } from "@admin/features/assistant/lib/assistant-tool-definitions";
import {
  isAssistantDeleteToolId,
  type AssistantToolId,
} from "@admin/features/assistant/types/assistant-tool.types";
import type { ExistReservation } from "@admin/features/reservation/types";
import {
  fetchAssistantReservationDetail,
} from "@admin/features/assistant/lib/fetch-assistant-reservations";
import {
  reservationForceDeleteArgsSchema,
  reservationsBatchDeleteArgsSchema,
} from "@admin/features/assistant/types/schemas/assistant-delete-tool.schema";
import {
  bannerDeleteArgsSchema,
  noticeDeleteArgsSchema,
} from "@admin/features/assistant/types/schemas/assistant-notice-banner.schema";

function requireBaseUrl(): string {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("BASE_URL is not configured");
  }
  return baseUrl;
}

function extractReservations(payload: unknown): ExistReservation[] {
  if (Array.isArray(payload)) {
    return payload as ExistReservation[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  for (const key of ["reservations", "items", "data"]) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value as ExistReservation[];
    }
  }

  return [];
}

async function loadDailyReservations(
  token: string,
  date: string,
): Promise<ExistReservation[]> {
  const response = await fetch(
    `${requireBaseUrl()}/reservation/daily?date=${encodeURIComponent(date)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`예약 조회 실패 (${date})`);
  }

  const payload: unknown = await response.json();
  return extractReservations(payload);
}

function toDeleteImpactItem(reservation: {
  reservationId: number;
  title: string;
  creatorName: string;
  date: string;
  startTime: string;
  endTime: string;
}): AssistantToolDiscardImpactItem {
  return {
    reservationId: reservation.reservationId,
    title: reservation.title,
    creatorName: reservation.creatorName,
    date: reservation.date,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
  };
}

async function loadDeleteToolImpact(
  token: string,
  toolId: AssistantToolId,
  args: Record<string, unknown>,
): Promise<AssistantToolDiscardImpactItem[]> {
  if (toolId === "reservation_force_delete") {
    const parsed = reservationForceDeleteArgsSchema.safeParse(args);
    if (!parsed.success) return [];

    const detail = await fetchAssistantReservationDetail(
      token,
      parsed.data.reservationId,
    );
    if (!detail) {
      return [
        {
          reservationId: parsed.data.reservationId,
          title: "(조회 실패)",
          creatorName: "-",
          date: "-",
          startTime: "-",
          endTime: "-",
        },
      ];
    }

    return [toDeleteImpactItem(detail)];
  }

  if (toolId === "reservations_batch_delete") {
    const parsed = reservationsBatchDeleteArgsSchema.safeParse(args);
    if (!parsed.success) return [];

    const items = await Promise.all(
      parsed.data.reservationIds.map(async (reservationId) => {
        const detail = await fetchAssistantReservationDetail(
          token,
          reservationId,
        );
        if (!detail) {
          return {
            reservationId,
            title: "(조회 실패)",
            creatorName: "-",
            date: "-",
            startTime: "-",
            endTime: "-",
          };
        }
        return toDeleteImpactItem(detail);
      }),
    );

    return items.sort((a, b) =>
      `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`),
    );
  }

  if (toolId === "notice_delete") {
    const parsed = noticeDeleteArgsSchema.safeParse(args);
    if (!parsed.success) return [];

    const detail = await fetchAssistantNoticeDetail(
      token,
      parsed.data.noticeId,
    );
    const title =
      detail && typeof detail.title === "string" ? detail.title : "(조회 실패)";
    return [
      {
        reservationId: parsed.data.noticeId,
        title,
        creatorName: "공지",
        date: "-",
        startTime: "-",
        endTime: "-",
      },
    ];
  }

  if (toolId === "banner_delete") {
    const parsed = bannerDeleteArgsSchema.safeParse(args);
    if (!parsed.success) return [];

    const detail = await fetchAssistantBannerDetail(
      token,
      parsed.data.bannerId,
    );
    const owner =
      detail && typeof detail.owner === "string" ? detail.owner : "(조회 실패)";
    return [
      {
        reservationId: parsed.data.bannerId,
        title: owner,
        creatorName: "배너",
        date: "-",
        startTime: "-",
        endTime: "-",
      },
    ];
  }

  return [];
}

export async function loadAssistantToolImpact(
  token: string,
  toolId: string,
  args: Record<string, unknown>,
): Promise<AssistantToolDiscardImpactItem[]> {
  const definition = getAssistantToolDefinition(toolId);
  if (!definition) {
    throw new Error("알 수 없는 도구입니다.");
  }

  const id = definition.id as AssistantToolId;

  if (
    id === "notice_create" ||
    id === "notice_update" ||
    id === "banner_create" ||
    id === "banner_update"
  ) {
    return [];
  }

  if (isAssistantDeleteToolId(id)) {
    return loadDeleteToolImpact(token, id, args);
  }

  const dates = listImpactDates(id, args);
  if (dates.length === 0) {
    return [];
  }

  const reservationsByDate: Record<string, ExistReservation[]> = {};
  await Promise.all(
    dates.map(async (date) => {
      reservationsByDate[date] = await loadDailyReservations(token, date);
    }),
  );

  return collectToolDiscardImpact(id, args, reservationsByDate);
}
