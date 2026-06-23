import { hasReservationCancelIntent } from "@admin/features/assistant/lib/assistant-reservation-intent";
import type { AssistantToolResultEntry } from "@admin/features/assistant/lib/assistant-tool-loop";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";

const LOOKUP_TOOL_IDS = new Set([
  "reservations_by_date_lookup",
  "reservations_by_term_lookup",
  "reservations_by_week_lookup",
]);

type ReservationLookupItem = {
  reservationId: number;
  title?: string;
  creatorName?: string;
  creatorNickname?: string | null;
  date?: string;
};

function normalizeToken(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function extractQuotedHint(message: string): string | null {
  const matches = Array.from(
    message.matchAll(/["'「『]([^"'」』]{1,80})["'」』]/g),
  );

  for (const match of matches) {
    const candidate = match[1]?.trim();
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function hasBareMonthListBulkPattern(normalized: string): boolean {
  return /^(?:(?:\d{4}년)?\d{1,2}월)+다$/.test(normalized);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function collectReservations(
  toolResults: AssistantToolResultEntry[],
): ReservationLookupItem[] {
  const items: ReservationLookupItem[] = [];

  for (const result of toolResults) {
    if (!result.ok || !result.data || !LOOKUP_TOOL_IDS.has(result.toolId)) {
      continue;
    }

    const reservations = result.data.reservations;
    if (!Array.isArray(reservations)) continue;

    for (const raw of reservations) {
      if (!raw || typeof raw !== "object") continue;
      const record = raw as Record<string, unknown>;
      const reservationId = record.reservationId;
      if (
        typeof reservationId !== "number" ||
        !Number.isInteger(reservationId) ||
        reservationId <= 0
      ) {
        continue;
      }

      items.push({
        reservationId,
        title: typeof record.title === "string" ? record.title : undefined,
        creatorName:
          typeof record.creatorName === "string" ? record.creatorName : undefined,
        creatorNickname:
          typeof record.creatorNickname === "string"
            ? record.creatorNickname
            : record.creatorNickname === null
              ? null
              : undefined,
        date: typeof record.date === "string" ? record.date : undefined,
      });
    }
  }

  const unique = new Map<number, ReservationLookupItem>();
  for (const item of items) {
    unique.set(item.reservationId, item);
  }

  return Array.from(unique.values());
}

export function extractCancelTargetHints(message: string): {
  titleHint: string | null;
  creatorHint: string | null;
} {
  const quoted = extractQuotedHint(message);

  const creatorPossessive = message.match(
    /([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,11})의\s*예약/,
  );
  const creatorAsReserver = message.match(
    /([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,11})가\s*예약자/,
  );
  const creatorHint =
    creatorPossessive?.[1]?.trim() ??
    creatorAsReserver?.[1]?.trim() ??
    null;

  const titleHint =
    quoted ?? (creatorHint ? `${creatorHint}의 예약` : null);

  return { titleHint, creatorHint };
}

export function extractReservationTargetHints(message: string): {
  titleHint: string | null;
  creatorHint: string | null;
} {
  const base = extractCancelTargetHints(message);
  if (base.titleHint || base.creatorHint) {
    return base;
  }

  const quotedTitle = message.match(
    /[''「『]([^''」』]{1,40})[''」』]\s*예약/,
  )?.[1]?.trim();
  if (quotedTitle) {
    return { titleHint: quotedTitle, creatorHint: null };
  }

  const bareTitle = message.match(
    /([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,20})의?\s*예약/,
  )?.[1]?.trim();
  if (
    bareTitle &&
    !/^(이번|다음|내일|오늘|모레|금주|금일)$/.test(bareTitle)
  ) {
    return { titleHint: bareTitle, creatorHint: null };
  }

  const titleBeforeTime = message.match(
    /^([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,20})\s+(?:\d{1,2}\s*시|종료|시작)/,
  )?.[1]?.trim();
  if (
    titleBeforeTime &&
    !/^(이번|다음|내일|오늘|모레|금주|금일|왜)$/.test(titleBeforeTime)
  ) {
    return { titleHint: titleBeforeTime, creatorHint: null };
  }

  return base;
}

export function selectReservationsForUpdate(
  message: string,
  reservations: ReservationLookupItem[],
): ReservationLookupItem[] {
  if (reservations.length === 0) return [];

  const { titleHint, creatorHint } = extractReservationTargetHints(message);
  let filtered = reservations;

  if (titleHint) {
    filtered = filtered.filter((item) => matchesTitleHint(item, titleHint));
  }

  if (creatorHint) {
    filtered = filtered.filter((item) => matchesCreatorHint(item, creatorHint));
  }

  if (titleHint || creatorHint) {
    return filtered;
  }

  if (reservations.length === 1) {
    return reservations;
  }

  return filtered;
}

function matchesTitleHint(
  reservation: ReservationLookupItem,
  titleHint: string,
): boolean {
  const title = normalizeToken(reservation.title ?? "");
  const hint = normalizeToken(titleHint);
  if (!title || !hint) return false;
  return title === hint || title.includes(hint) || hint.includes(title);
}

function matchesCreatorHint(
  reservation: ReservationLookupItem,
  creatorHint: string,
): boolean {
  const hint = normalizeToken(creatorHint);
  const name = normalizeToken(reservation.creatorName ?? "");
  const nickname = normalizeToken(reservation.creatorNickname ?? "");
  return (
    (name.length > 0 && (name === hint || name.includes(hint))) ||
    (nickname.length > 0 && (nickname === hint || nickname.includes(hint)))
  );
}

export function selectReservationsForCancel(
  message: string,
  reservations: ReservationLookupItem[],
): ReservationLookupItem[] {
  if (reservations.length === 0) return [];

  const normalized = message.replace(/\s+/g, "");
  const cancelAll =
    /(?:전부|모두|전체|다취소|다삭제|일괄)/.test(normalized) ||
    hasBareMonthListBulkPattern(normalized);
  if (cancelAll) return reservations;

  const { titleHint, creatorHint } = extractCancelTargetHints(message);
  let filtered = reservations;

  if (titleHint) {
    filtered = filtered.filter((item) => matchesTitleHint(item, titleHint));
  }

  if (creatorHint) {
    filtered = filtered.filter((item) => matchesCreatorHint(item, creatorHint));
  }

  if (titleHint || creatorHint) {
    return filtered;
  }

  if (filtered.length === 0 && reservations.length === 1) {
    return reservations;
  }

  if (
    filtered.length === 0 &&
    /(?:1\s*건|한\s*건|하나)/.test(normalized) &&
    reservations.length === 1
  ) {
    return reservations;
  }

  return filtered;
}

function buildDeleteActionFromIds(
  reservationIds: number[],
): AssistantAnalysis["action"] | null {
  if (reservationIds.length === 0) return null;

  if (reservationIds.length === 1) {
    return {
      type: "DELETE_RESERVATION",
      payload: { reservationId: reservationIds[0] },
    };
  }

  return {
    type: "DELETE_RESERVATIONS_BATCH",
    payload: { reservationIds },
  };
}

export function buildCancelActionFromLookup(
  message: string,
  toolResults: AssistantToolResultEntry[],
): AssistantAnalysis["action"] | null {
  if (!hasReservationCancelIntent(message)) {
    return null;
  }

  const reservations = collectReservations(toolResults);
  if (reservations.length === 0) {
    return null;
  }

  const selected = selectReservationsForCancel(message, reservations);
  const reservationIds = selected.map((item) => item.reservationId).sort((a, b) => a - b);

  return buildDeleteActionFromIds(reservationIds);
}

function isDeleteActionType(type: string | undefined): boolean {
  return type === "DELETE_RESERVATION" || type === "DELETE_RESERVATIONS_BATCH";
}

export function deletePayloadHasIds(payload: Record<string, unknown> | undefined): boolean {
  if (!payload) return false;
  return getDeleteReservationIds(payload).length > 0;
}

function getDeleteReservationIds(
  payload: Record<string, unknown> | undefined,
): number[] {
  if (!payload) return [];

  if (
    typeof payload.reservationId === "number" &&
    Number.isInteger(payload.reservationId) &&
    payload.reservationId > 0
  ) {
    return [payload.reservationId];
  }

  if (!Array.isArray(payload.reservationIds)) {
    return [];
  }

  return payload.reservationIds.filter(
    (id): id is number =>
      typeof id === "number" && Number.isInteger(id) && id > 0,
  );
}

function deletePayloadMatchesCancelSelection(
  cancelMessage: string,
  toolResults: AssistantToolResultEntry[],
  payload: Record<string, unknown> | undefined,
): boolean {
  const selectedIds = new Set(
    selectReservationsForCancel(
      cancelMessage,
      collectReservations(toolResults),
    ).map((item) => item.reservationId),
  );

  if (selectedIds.size === 0) {
    return false;
  }

  const ids = getDeleteReservationIds(payload);
  return ids.length > 0 && ids.every((id) => selectedIds.has(id));
}

export function enrichAnalysisWithCancelIntent(
  analysis: AssistantAnalysis,
  message: string,
  toolResults: AssistantToolResultEntry[],
): AssistantAnalysis {
  if (
    !hasReservationCancelIntent(message) &&
    !hasReservationCancelIntent(analysis.summary)
  ) {
    return analysis;
  }

  const cancelMessage = (() => {
    const hints = extractCancelTargetHints(message);
    if (hints.titleHint || hints.creatorHint) return message;
    const summaryHints = extractCancelTargetHints(analysis.summary);
    if (summaryHints.titleHint || summaryHints.creatorHint) {
      return `${message}\n${analysis.summary}`;
    }
    return message;
  })();

  const lookupAction = buildCancelActionFromLookup(cancelMessage, toolResults);
  const currentPayload = isPlainRecord(analysis.action?.payload)
    ? analysis.action.payload
    : undefined;

  if (isDeleteActionType(analysis.action?.type)) {
    if (
      deletePayloadHasIds(currentPayload) &&
      deletePayloadMatchesCancelSelection(
        cancelMessage,
        toolResults,
        currentPayload,
      )
    ) {
      return {
        ...analysis,
        admin_action_required: true,
        fallback_required: false,
        confidence: Math.max(analysis.confidence, 0.85),
        recommended_action:
          analysis.recommended_action.trim() ||
          "아래 내용을 확인한 뒤 승인하면 취소가 실행됩니다.",
      };
    }

    if (lookupAction && deletePayloadHasIds(lookupAction.payload)) {
      const count =
        lookupAction.type === "DELETE_RESERVATIONS_BATCH"
          ? ((lookupAction.payload?.reservationIds as number[] | undefined)
              ?.length ?? 0)
          : 1;

      return {
        ...analysis,
        admin_action_required: true,
        fallback_required: false,
        confidence: Math.max(analysis.confidence, 0.9),
        recommended_action: `총 ${count}건 예약 취소를 제안합니다. 아래 내용을 확인한 뒤 승인해주세요.`,
        action: lookupAction,
      };
    }

    const lookedUp = toolResults.some(
      (result) => result.ok && LOOKUP_TOOL_IDS.has(result.toolId),
    );
    if (lookedUp) {
      return {
        ...analysis,
        admin_action_required: false,
        recommended_action: "",
        action: { type: "NONE" },
      };
    }

    return analysis;
  }

  if (!lookupAction) {
    const lookedUp = toolResults.some(
      (result) => result.ok && LOOKUP_TOOL_IDS.has(result.toolId),
    );
    if (lookedUp) {
      return {
        ...analysis,
        summary: analysis.summary.trim() || "취소할 예약이 없습니다.",
        admin_action_required: false,
        recommended_action: "",
        action: { type: "NONE" },
      };
    }
    return analysis;
  }

  const count =
    lookupAction.type === "DELETE_RESERVATIONS_BATCH"
      ? ((lookupAction.payload?.reservationIds as number[] | undefined)?.length ??
        0)
      : 1;

  return {
    ...analysis,
    admin_action_required: true,
    fallback_required: false,
    confidence: Math.max(analysis.confidence, 0.9),
    recommended_action: `총 ${count}건 예약 취소를 제안합니다. 아래 내용을 확인한 뒤 승인해주세요.`,
    action: lookupAction,
  };
}
