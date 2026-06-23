import type { DateReservation } from "@admin/features/reservation/types";

type ReservationDetail = DateReservation & { creatorId?: number };

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function buildReservationPatchBody(
  detail: ReservationDetail,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const reservationType =
    (typeof patch.reservationType === "string"
      ? patch.reservationType
      : detail.reservationType) ?? detail.reservationType;

  const body: Record<string, unknown> = {
    title:
      typeof patch.title === "string" && patch.title.trim()
        ? patch.title.trim()
        : detail.title,
    date:
      typeof patch.date === "string" && patch.date.trim()
        ? patch.date.trim()
        : detail.date,
    startTime:
      typeof patch.startTime === "string" ? patch.startTime : detail.startTime,
    endTime: typeof patch.endTime === "string" ? patch.endTime : detail.endTime,
    participationAvailable:
      typeof patch.participationAvailable === "boolean"
        ? patch.participationAvailable
        : detail.participationAvailable,
    reservationType,
  };

  if (reservationType === "EXTERNAL") {
    body.externalCreatorName =
      typeof patch.externalCreatorName === "string" &&
      patch.externalCreatorName.trim()
        ? patch.externalCreatorName.trim()
        : detail.creatorName;
    return body;
  }

  const creatorId =
    typeof patch.creatorId === "number" && patch.creatorId > 0
      ? patch.creatorId
      : detail.creatorId;

  if (typeof creatorId === "number" && creatorId > 0) {
    body.creatorId = creatorId;
  }

  return body;
}

export function extractReservationUpdatePatch(
  args: Record<string, unknown>,
): Record<string, unknown> {
  if (!isPlainRecord(args)) return {};

  const patch: Record<string, unknown> = {};
  const keys = [
    "title",
    "date",
    "startTime",
    "endTime",
    "reservationType",
    "participationAvailable",
    "creatorId",
    "externalCreatorName",
  ] as const;

  for (const key of keys) {
    if (args[key] !== undefined) {
      patch[key] = args[key];
    }
  }

  return patch;
}
