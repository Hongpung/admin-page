import "server-only";

import {
  applyExternalCreatorFallbackToReservationPayload,
  extractCreatorDisplayName,
} from "@admin/features/assistant/lib/apply-external-creator-fallback";
import {
  evaluateDraftQueue,
  evaluateQueuedAction,
} from "@admin/features/assistant/lib/assistant-action-queue";
import { autoResolveQueuedActionGaps } from "@admin/features/assistant/lib/auto-resolve-queued-action-gaps";
import { fetchAssistantMemberSearch } from "@admin/features/assistant/lib/fetch-assistant-members";
import {
  buildTitleOnlyExternalReservationPayload,
  isTitleOnlyExternalScheduleSlot,
} from "@admin/features/assistant/lib/assistant-schedule-canonical-format";
import {
  attachMemberLookupHintsToPayload,
  resolveMemberLookup,
  type MemberLookupResolution,
} from "@admin/features/assistant/lib/resolve-member-id-from-search";
import type { AssistantDraft } from "@admin/features/assistant/types/assistant-draft.types";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasValidCreatorId(payload: Record<string, unknown>): boolean {
  return (
    typeof payload.creatorId === "number" &&
    Number.isInteger(payload.creatorId) &&
    payload.creatorId > 0
  );
}

function isExternalReady(payload: Record<string, unknown>): boolean {
  return (
    payload.reservationType === "EXTERNAL" &&
    typeof payload.externalCreatorName === "string" &&
    payload.externalCreatorName.trim().length > 0
  );
}

function applyMemberLookupToPayload(
  payload: Record<string, unknown>,
  creatorName: string,
  lookup: MemberLookupResolution,
): Record<string, unknown> {
  if (lookup.status === "matched") {
    const next: Record<string, unknown> = {
      ...payload,
      creatorId: lookup.memberId,
    };
    delete next.creatorName;
    return next;
  }

  if (lookup.status === "ambiguous") {
    return attachMemberLookupHintsToPayload({ ...payload, creatorName }, lookup);
  }

  return applyExternalCreatorFallbackToReservationPayload(payload, {
    memberLookup: lookup,
  });
}

/**
 * 큐에 쌓인 CREATE_RESERVATION·RESERVATION_BATCH_CREATE에 대해 예약자 lookup을 선행합니다.
 */
export async function prefetchCreatorsForDraftQueue(
  token: string,
  draft: AssistantDraft,
): Promise<AssistantDraft> {
  const lookupByName = new Map<string, MemberLookupResolution>();

  const queue = await Promise.all(
    draft.queue.map(async (item) => {
      if (item.type === "RESERVATION_BATCH_CREATE") {
        const payload = isPlainRecord(item.payload) ? item.payload : {};
        const option = isPlainRecord(payload.batchReservationOption)
          ? payload.batchReservationOption
          : {};
        if (
          option.reservationType === "EXTERNAL" ||
          (typeof option.creatorId === "number" &&
            Number.isInteger(option.creatorId) &&
            option.creatorId > 0)
        ) {
          return evaluateQueuedAction(item);
        }

        const autoResolved = await autoResolveQueuedActionGaps(token, item, {
          userMessage: "",
          detectedText: "",
          toolResults: [],
          llmTurns: 0,
          startedAt: new Date().toISOString(),
        });
        return autoResolved.action;
      }

      if (item.type !== "CREATE_RESERVATION") {
        return item;
      }

      const payload = isPlainRecord(item.payload) ? item.payload : {};
      if (hasValidCreatorId(payload) || isExternalReady(payload)) {
        return evaluateQueuedAction(item);
      }

      const title =
        typeof payload.title === "string" ? payload.title.trim() : "";
      const creatorName = extractCreatorDisplayName(payload);
      if (
        title &&
        creatorName &&
        isTitleOnlyExternalScheduleSlot({
          title,
          creatorName,
          kindHint:
            payload.reservationType === "EXTERNAL" ? "EXTERNAL" : null,
        })
      ) {
        const date = typeof payload.date === "string" ? payload.date : "";
        const startTime =
          typeof payload.startTime === "string" ? payload.startTime : "";
        const endTime =
          typeof payload.endTime === "string" ? payload.endTime : "";
        if (date && startTime && endTime) {
          return evaluateQueuedAction({
            ...item,
            payload: applyExternalCreatorFallbackToReservationPayload(
              buildTitleOnlyExternalReservationPayload({
                title,
                date,
                startTime,
                endTime,
              }),
            ),
          });
        }
      }

      if (!creatorName?.trim()) {
        return evaluateQueuedAction(item);
      }

      let lookup = lookupByName.get(creatorName);
      if (!lookup) {
        try {
          const result = await fetchAssistantMemberSearch(token, {
            username: creatorName,
            page: 0,
            pageSize: 20,
          });
          lookup = resolveMemberLookup(creatorName, result.members);
        } catch {
          lookup = { status: "not_found", query: creatorName };
        }
        lookupByName.set(creatorName, lookup);
      }

      const nextPayload = applyMemberLookupToPayload(
        payload,
        creatorName,
        lookup,
      );

      return evaluateQueuedAction({
        ...item,
        payload: nextPayload,
      });
    }),
  );

  return evaluateDraftQueue({
    ...draft,
    queue,
  });
}
