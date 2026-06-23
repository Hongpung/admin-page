import "server-only";

import { fetchAssistantMemberSearch } from "@admin/features/assistant/lib/fetch-assistant-members";
import { applyExternalCreatorFallbackToReservationPayload } from "@admin/features/assistant/lib/apply-external-creator-fallback";
import {
  extractDatedScheduleSlotsFromText,
  type DatedScheduleSlot,
} from "@admin/features/assistant/lib/extract-dated-schedule-slots";
import {
  buildTitleOnlyExternalReservationPayload,
  inferScheduleSlotKind,
  isTitleOnlyExternalScheduleSlot,
  scheduleSlotKindToReservation,
} from "@admin/features/assistant/lib/assistant-schedule-canonical-format";
import {
  attachMemberLookupHintsToPayload,
  resolveMemberLookup,
  type MemberLookupResolution,
} from "@admin/features/assistant/lib/resolve-member-id-from-search";
import type { AssistantAction } from "@admin/features/assistant/types/assistant-analysis.types";

export type { DatedScheduleSlot } from "@admin/features/assistant/lib/extract-dated-schedule-slots";
export { extractDatedScheduleSlotsFromText } from "@admin/features/assistant/lib/extract-dated-schedule-slots";

function buildReservationPayload(
  slot: DatedScheduleSlot,
  lookup: MemberLookupResolution,
): Record<string, unknown> {
  if (isTitleOnlyExternalScheduleSlot(slot)) {
    return applyExternalCreatorFallbackToReservationPayload(
      buildTitleOnlyExternalReservationPayload(slot),
    );
  }

  const kind = inferScheduleSlotKind(slot.title, slot.kindHint);
  const base = {
    title: slot.title,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
  };

  if (lookup.status === "not_found" || kind === "external") {
    return applyExternalCreatorFallbackToReservationPayload(
      {
        ...base,
        reservationType: "EXTERNAL",
        participationAvailable: false,
        externalCreatorName: slot.creatorName,
      },
      { memberLookup: lookup },
    );
  }

  if (lookup.status === "matched") {
    const { reservationType, participationAvailable } =
      scheduleSlotKindToReservation(kind, lookup.memberId);

    return {
      ...base,
      reservationType,
      participationAvailable,
      creatorId: lookup.memberId,
    };
  }

  const { reservationType, participationAvailable } =
    scheduleSlotKindToReservation(kind, null);

  return attachMemberLookupHintsToPayload(
    {
      ...base,
      reservationType,
      participationAvailable,
      creatorName: slot.creatorName,
    },
    lookup,
  );
}

export async function buildCreateReservationsFromScheduleMessage(
  token: string,
  message: string,
  detectedText: string,
): Promise<AssistantAction[]> {
  const slots = extractDatedScheduleSlotsFromText(message, detectedText);
  if (slots.length === 0) return [];

  const uniqueNames = Array.from(
    new Set(
      slots
        .filter((slot) => !isTitleOnlyExternalScheduleSlot(slot))
        .map((slot) => slot.creatorName)
        .filter(Boolean),
    ),
  );
  const lookupByName = new Map<string, MemberLookupResolution>();

  await Promise.all(
    uniqueNames.map(async (name) => {
      try {
        const result = await fetchAssistantMemberSearch(token, {
          username: name,
          page: 0,
          pageSize: 20,
        });
        lookupByName.set(name, resolveMemberLookup(name, result.members));
      } catch {
        lookupByName.set(name, { status: "not_found", query: name });
      }
    }),
  );

  return slots.map((slot) => ({
    type: "CREATE_RESERVATION" as const,
    payload: buildReservationPayload(
      slot,
      lookupByName.get(slot.creatorName) ?? {
        status: "not_found",
        query: slot.creatorName,
      },
    ),
  }));
}
