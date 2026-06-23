import type { MemberLookupResolution } from "@admin/features/assistant/lib/resolve-member-id-from-search";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasValidCreatorId(payload: Record<string, unknown>): boolean {
  return (
    typeof payload.creatorId === "number" &&
    Number.isInteger(payload.creatorId) &&
    payload.creatorId > 0
  );
}

export function extractCreatorDisplayName(
  payload: Record<string, unknown>,
): string | null {
  if (isNonEmptyString(payload.externalCreatorName)) {
    return payload.externalCreatorName.trim();
  }
  if (isNonEmptyString(payload.creatorName)) {
    return payload.creatorName.trim();
  }
  return null;
}

/**
 * 회원 검색 결과가 0건일 때만 COMMON/REGULAR → EXTERNAL로 전환합니다.
 * 후보가 있으면 payload를 그대로 두고 예약자 이름 확인을 기다립니다.
 */
export function applyExternalCreatorFallbackToReservationPayload(
  payload: Record<string, unknown>,
  options?: { memberLookup?: MemberLookupResolution },
): Record<string, unknown> {
  if (payload.reservationType === "EXTERNAL") {
    const name = extractCreatorDisplayName(payload);
    if (!name) return payload;
    const next: Record<string, unknown> = {
      ...payload,
      participationAvailable: false,
      externalCreatorName: name,
    };
    delete next.creatorId;
    delete next.creatorName;
    return next;
  }

  if (hasValidCreatorId(payload)) {
    return payload;
  }

  const lookup = options?.memberLookup;
  if (lookup && lookup.status !== "not_found") {
    return payload;
  }

  if (lookup?.status !== "not_found") {
    return payload;
  }

  const externalName = extractCreatorDisplayName(payload);
  if (!externalName) {
    return payload;
  }

  const next: Record<string, unknown> = {
    ...payload,
    reservationType: "EXTERNAL",
    participationAvailable: false,
    externalCreatorName: externalName,
  };
  delete next.creatorId;
  delete next.creatorName;
  return next;
}

export function applyExternalCreatorFallbackToBatchOption(
  option: Record<string, unknown>,
  options?: { memberLookup?: MemberLookupResolution },
): Record<string, unknown> {
  if (option.reservationType === "EXTERNAL") {
    const name =
      (isNonEmptyString(option.externalCreatorName)
        ? option.externalCreatorName
        : isNonEmptyString(option.creatorName)
          ? option.creatorName
          : null) ?? null;
    if (!name) return option;
    return {
      ...option,
      externalCreatorName: name,
      creatorId: undefined,
      creatorName: undefined,
    };
  }

  const hasCreatorId =
    typeof option.creatorId === "number" &&
    Number.isInteger(option.creatorId) &&
    option.creatorId > 0;
  if (hasCreatorId) return option;

  const lookup = options?.memberLookup;
  if (lookup && lookup.status !== "not_found") {
    return option;
  }
  if (lookup?.status !== "not_found") {
    return option;
  }

  const externalName = isNonEmptyString(option.externalCreatorName)
    ? option.externalCreatorName.trim()
    : isNonEmptyString(option.creatorName)
      ? option.creatorName.trim()
      : null;
  if (!externalName) return option;

  return {
    ...option,
    reservationType: "EXTERNAL",
    externalCreatorName: externalName,
    creatorId: undefined,
    creatorName: undefined,
  };
}
