import type { AssistantLookupResultEntry } from "@admin/features/assistant/lib/assistant-tool-catalog";

type ReservationLookupItem = {
  date?: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  creatorName?: string;
};

export function looksLikePendingLookup(summary: string): boolean {
  const text = summary.trim();
  if (!text) return true;
  return /조회(합니다|할|중|해|하겠)|불러오(는|겠|고)|가져오(는|겠|고)|확인(합니다|할|하겠)/.test(
    text,
  );
}

function formatReservationLine(reservation: ReservationLookupItem): string {
  const datePrefix = reservation.date ? `${reservation.date} ` : "";
  const time =
    reservation.startTime && reservation.endTime
      ? `${reservation.startTime}~${reservation.endTime}`
      : "시간 미상";
  const title = reservation.title?.trim() || "제목 없음";
  const creator = reservation.creatorName?.trim();
  const body = creator ? `${time} ${title} (${creator})` : `${time} ${title}`;
  return `- ${datePrefix}${body}`;
}

function buildFromReservations(
  label: string,
  reservations: ReservationLookupItem[],
): string {
  if (reservations.length === 0) {
    return `${label} 예약이 없습니다.`;
  }

  const lines = reservations.map(formatReservationLine);
  return `${label} 예약 ${reservations.length}건:\n${lines.join("\n")}`;
}

export function buildReservationLookupSummary(
  toolResults: AssistantLookupResultEntry[],
): string | null {
  const weekEntry = toolResults.find(
    (result) =>
      result.toolId === "reservations_by_week_lookup" && result.ok && result.data,
  );
  if (weekEntry?.data) {
    const reservations = weekEntry.data.reservations;
    const startDate =
      typeof weekEntry.data.startDate === "string"
        ? weekEntry.data.startDate
        : "";
    const endDate =
      typeof weekEntry.data.endDate === "string" ? weekEntry.data.endDate : "";
    if (Array.isArray(reservations)) {
      const label =
        startDate && endDate ? `${startDate}~${endDate}` : "이번 주";
      return buildFromReservations(label, reservations as ReservationLookupItem[]);
    }
  }

  const termEntry = toolResults.find(
    (result) =>
      result.toolId === "reservations_by_term_lookup" && result.ok && result.data,
  );
  if (termEntry?.data) {
    const reservations = termEntry.data.reservations;
    const startDate =
      typeof termEntry.data.startDate === "string"
        ? termEntry.data.startDate
        : "";
    const endDate =
      typeof termEntry.data.endDate === "string" ? termEntry.data.endDate : "";
    if (Array.isArray(reservations) && startDate && endDate) {
      return buildFromReservations(
        `${startDate}~${endDate}`,
        reservations as ReservationLookupItem[],
      );
    }
  }

  const dateEntry = toolResults.find(
    (result) =>
      result.toolId === "reservations_by_date_lookup" && result.ok && result.data,
  );
  if (dateEntry?.data) {
    const date =
      typeof dateEntry.data.date === "string"
        ? dateEntry.data.date
        : dateEntry.args.date;
    const reservations = dateEntry.data.reservations;
    if (typeof date === "string" && Array.isArray(reservations)) {
      return buildFromReservations(date, reservations as ReservationLookupItem[]);
    }
  }

  return null;
}
