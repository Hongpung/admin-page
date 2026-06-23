import "server-only";

import { fetchAssistantMemberSearch } from "@admin/features/assistant/lib/fetch-assistant-members";
import {
  applyExternalCreatorFallbackToBatchOption,
  applyExternalCreatorFallbackToReservationPayload,
} from "@admin/features/assistant/lib/apply-external-creator-fallback";
import {
  attachMemberLookupHintsToPayload,
  resolveMemberLookupFromNameOrId,
} from "@admin/features/assistant/lib/resolve-member-id-from-search";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function lookupMembers(
  token: string,
  username: string,
) {
  const result = await fetchAssistantMemberSearch(token, {
    username,
    page: 0,
    pageSize: 20,
  });
  return result.members;
}

async function applyCreatorLookupOrExternal(
  token: string,
  item: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const next = { ...item };

  if (next.reservationType === "EXTERNAL") {
    if (
      typeof next.externalCreatorName === "string" &&
      next.externalCreatorName.trim()
    ) {
      delete next.creatorName;
      return next;
    }
    if (typeof next.creatorName === "string" && next.creatorName.trim()) {
      next.externalCreatorName = next.creatorName.trim();
      delete next.creatorName;
    }
    return next;
  }

  const lookupValue =
    next.creatorId !== undefined
      ? next.creatorId
      : typeof next.creatorName === "string"
        ? next.creatorName
        : null;

  if (lookupValue == null) {
    return next;
  }

  const lookup = await resolveMemberLookupFromNameOrId(
    (username) => lookupMembers(token, username),
    lookupValue,
  );

  if (lookup.status === "matched") {
    next.creatorId = lookup.memberId;
    delete next.creatorName;
    return next;
  }

  if (lookup.status === "ambiguous") {
    return attachMemberLookupHintsToPayload(
      {
        ...next,
        creatorName:
          typeof next.creatorName === "string" && next.creatorName.trim()
            ? next.creatorName.trim()
            : lookup.query,
      },
      lookup,
    );
  }

  return applyExternalCreatorFallbackToReservationPayload(next, {
    memberLookup: lookup,
  });
}

async function resolveReservationItemCreators(
  token: string,
  item: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return applyCreatorLookupOrExternal(token, item);
}

export async function resolveCreatorFieldsInPatch(
  token: string,
  patch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const next: Record<string, unknown> = { ...patch };

  if (
    next.creatorId !== undefined ||
    typeof next.creatorName === "string" ||
    next.reservationType !== undefined
  ) {
    const resolved = await applyCreatorLookupOrExternal(token, next);
    Object.assign(next, resolved);
  }

  const batchOption = next.batchReservationOption;
  if (isPlainRecord(batchOption)) {
    const lookupValue =
      batchOption.creatorId !== undefined
        ? batchOption.creatorId
        : typeof batchOption.creatorName === "string"
          ? batchOption.creatorName
          : null;

    if (lookupValue != null) {
      const lookup = await resolveMemberLookupFromNameOrId(
        (username) => lookupMembers(token, username),
        lookupValue,
      );

      if (lookup.status === "matched") {
        next.batchReservationOption = {
          ...batchOption,
          creatorId: lookup.memberId,
          creatorName: undefined,
        };
      } else if (lookup.status === "ambiguous") {
        return attachMemberLookupHintsToPayload(
          {
            ...next,
            batchReservationOption: {
              ...batchOption,
              creatorName:
                typeof batchOption.creatorName === "string" &&
                batchOption.creatorName.trim()
                  ? batchOption.creatorName.trim()
                  : lookup.query,
            },
          },
          lookup,
        );
      } else {
        next.batchReservationOption = applyExternalCreatorFallbackToBatchOption(
          batchOption,
          { memberLookup: lookup },
        );
      }
    }
  }

  if (Array.isArray(next.reservations)) {
    next.reservations = await Promise.all(
      next.reservations.map(async (item) =>
        isPlainRecord(item)
          ? resolveReservationItemCreators(token, item)
          : item,
      ),
    );
  }

  return next;
}

export async function resolveCreatorFieldsInPayload(
  token: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return resolveCreatorFieldsInPatch(token, payload);
}
