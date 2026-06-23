import { clampReservationPayloadEndTimes } from "@admin/features/assistant/lib/clamp-reservation-end-time";

const BATCH_OPTION_FIELDS = [
  "title",
  "reservationType",
  "creatorId",
  "creatorName",
  "clubName",
] as const;

const BATCH_ROOT_ONLY_FIELDS = [
  "noticeAll",
  "participationAvailable",
  "patch",
  "reservations",
  "externalCreatorName",
  "date",
  "startTime",
  "endTime",
  "channel",
  "content",
  "bannerImgUrl",
  "href",
  "owner",
  "noticeId",
  "bannerId",
  "reservationId",
  "reservationIds",
] as const;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isBatchSummaryTitle(value: string): boolean {
  return /외\s*\d+\s*팀|batch-action|\.json|_REGULAR_|하계\s*방학\s*정기\s*예약\s*:/i.test(
    value,
  );
}

function isInvalidBatchTitle(value: string): boolean {
  return /\bundefined\b/i.test(value.trim());
}

function formatClubRegularPracticeTitle(clubName: string): string {
  return `${clubName.trim()}의 정기 연습`;
}

function resolveBatchOptionTitle(option: Record<string, unknown>): void {
  const clubName =
    typeof option.clubName === "string" ? option.clubName.trim() : "";
  const title = typeof option.title === "string" ? option.title.trim() : "";

  if (clubName) {
    if (!title || isBatchSummaryTitle(title) || isInvalidBatchTitle(title)) {
      option.title = formatClubRegularPracticeTitle(clubName);
    }
    return;
  }

  if (title && (isBatchSummaryTitle(title) || isInvalidBatchTitle(title))) {
    delete option.title;
  }
}

export function normalizeReservationBatchPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...payload };
  const option = isPlainRecord(next.batchReservationOption)
    ? { ...next.batchReservationOption }
    : {};

  for (const key of BATCH_OPTION_FIELDS) {
    const rootValue = next[key];
    if (rootValue !== undefined && option[key] === undefined) {
      option[key] = rootValue;
    }
  }

  resolveBatchOptionTitle(option);

  if (!isPlainRecord(next.duration)) {
    const startDate = next.startDate;
    const endDate = next.endDate;
    if (typeof startDate === "string" && typeof endDate === "string") {
      next.duration = { startDate, endDate };
    }
  }

  if (Object.keys(option).length > 0) {
    next.batchReservationOption = option;
  }

  for (const key of BATCH_OPTION_FIELDS) {
    delete next[key];
  }

  for (const key of BATCH_ROOT_ONLY_FIELDS) {
    delete next[key];
  }

  delete next.startDate;
  delete next.endDate;

  return clampReservationPayloadEndTimes(next);
}

export function normalizeReservationBatchActionPayload(
  type: string,
  payload: unknown,
): Record<string, unknown> {
  if (type !== "RESERVATION_BATCH_CREATE" || !isPlainRecord(payload)) {
    return isPlainRecord(payload) ? payload : {};
  }

  return normalizeReservationBatchPayload(payload);
}
