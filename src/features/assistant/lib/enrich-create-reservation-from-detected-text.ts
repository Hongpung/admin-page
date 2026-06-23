import {
  extractCreatorDisplayName,
} from "@admin/features/assistant/lib/apply-external-creator-fallback";
import {
  inferScheduleSlotKind,
  scheduleSlotKindToReservation,
} from "@admin/features/assistant/lib/assistant-schedule-canonical-format";
import {
  extractDatedScheduleSlotsFromText,
  type DatedScheduleSlot,
} from "@admin/features/assistant/lib/extract-dated-schedule-slots";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function resolveReservationDefaultsFromExplicitHint(
  hint?: string | null,
):
  | { reservationType: "COMMON" | "REGULAR" | "EXTERNAL"; participationAvailable: boolean }
  | null {
  const normalizedHint = hint?.trim().toUpperCase() ?? "";
  if (!normalizedHint) return null;

  if (normalizedHint.includes("EXTERNAL")) {
    return {
      reservationType: "EXTERNAL",
      participationAvailable: false,
    };
  }

  if (normalizedHint.includes("REGULAR")) {
    return {
      reservationType: "REGULAR",
      participationAvailable: false,
    };
  }

  if (normalizedHint.includes("COMMON")) {
    return {
      reservationType: "COMMON",
      participationAvailable: normalizedHint.includes("OPEN"),
    };
  }

  return null;
}

function findMatchingSlot(
  payload: Record<string, unknown>,
  slots: DatedScheduleSlot[],
  slotIndex?: number,
): DatedScheduleSlot | null {
  if (
    typeof slotIndex === "number" &&
    slotIndex >= 0 &&
    slotIndex < slots.length
  ) {
    return slots[slotIndex] ?? null;
  }

  const title = isNonEmptyString(payload.title) ? payload.title.trim() : "";
  const date = isNonEmptyString(payload.date) ? payload.date.trim() : "";
  const startTime = isNonEmptyString(payload.startTime)
    ? payload.startTime.trim()
    : "";

  const exact = slots.find(
    (slot) =>
      slot.title === title &&
      (!date || slot.date === date) &&
      (!startTime || slot.startTime === startTime),
  );
  if (exact) return exact;

  if (title) {
    const byTitle = slots.find((slot) => slot.title === title);
    if (byTitle) return byTitle;
  }

  return null;
}

export function enrichCreateReservationFromDetectedText(
  payload: Record<string, unknown>,
  message: string,
  detectedText: string,
  slotIndex?: number,
): Record<string, unknown> {
  if (!detectedText.trim()) {
    return payload;
  }

  const slots = extractDatedScheduleSlotsFromText(message, detectedText);
  const slot = findMatchingSlot(payload, slots, slotIndex);
  if (!slot) {
    return payload;
  }

  const kind = inferScheduleSlotKind(slot.title, slot.kindHint);
  const reservationDefaults =
    resolveReservationDefaultsFromExplicitHint(slot.kindHint) ??
    scheduleSlotKindToReservation(kind, null);

  const next: Record<string, unknown> = {
    ...payload,
    title: isNonEmptyString(payload.title) ? payload.title : slot.title,
    date: isNonEmptyString(payload.date) ? payload.date : slot.date,
    startTime: isNonEmptyString(payload.startTime)
      ? payload.startTime
      : slot.startTime,
    endTime: isNonEmptyString(payload.endTime) ? payload.endTime : slot.endTime,
    creatorName: extractCreatorDisplayName(payload) ?? slot.creatorName,
  };

  if (!isNonEmptyString(next.reservationType)) {
    next.reservationType = reservationDefaults.reservationType;
    next.participationAvailable = reservationDefaults.participationAvailable;
  } else if (next.participationAvailable === undefined) {
    next.participationAvailable = reservationDefaults.participationAvailable;
  }

  return next;
}
