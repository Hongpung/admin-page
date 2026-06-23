import {
  extractNoticeIdFromMessage,
  hasNoticeDeleteIntent,
  hasNoticeUpdateIntent,
} from "@admin/features/assistant/lib/assistant-notice-intent";
import {
  extractNoticeFieldsFromMessage,
  extractNoticeMatchTitle,
} from "@admin/features/assistant/lib/prefill-notice-from-message";
import type { AssistantToolResultEntry } from "@admin/features/assistant/lib/assistant-tool-loop";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";

type NoticeLookupItem = {
  noticeId?: number;
  title?: string;
};

const LOOKUP_TOOL_ID = "notices_list_lookup";

function normalizeToken(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function scoreNoticeTitleMatch(notice: NoticeLookupItem, query: string): number {
  const normalizedQuery = normalizeToken(query);
  const title = normalizeToken(notice.title ?? "");

  if (!normalizedQuery || !title) return 0;
  if (title === normalizedQuery) return 100;
  if (title.includes(normalizedQuery) || normalizedQuery.includes(title)) {
    return 80;
  }
  return 0;
}

function collectNotices(toolResults: AssistantToolResultEntry[]): NoticeLookupItem[] {
  const entry = toolResults.find(
    (result) => result.ok && result.toolId === LOOKUP_TOOL_ID && result.data,
  );
  const notices = entry?.data?.notices;
  if (!Array.isArray(notices)) return [];
  return notices as NoticeLookupItem[];
}

export function resolveNoticeIdFromLookup(
  message: string,
  toolResults: AssistantToolResultEntry[],
): number | null {
  const explicitId = extractNoticeIdFromMessage(message);
  if (explicitId !== null) return explicitId;

  const matchTitle = extractNoticeMatchTitle(message);
  if (!matchTitle) return null;

  const notices = collectNotices(toolResults);
  if (notices.length === 0) return null;

  const scored = notices
    .map((notice) => ({
      notice,
      score: scoreNoticeTitleMatch(notice, matchTitle),
    }))
    .filter(
      (item) =>
        typeof item.notice.noticeId === "number" &&
        item.notice.noticeId > 0 &&
        item.score > 0,
    )
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const best = scored[0];
  if (!best || typeof best.notice.noticeId !== "number") return null;

  if (best.score >= 100) {
    const tied = scored.filter((item) => item.score === best.score);
    if (tied.length === 1) {
      return best.notice.noticeId;
    }
  }

  if (notices.length === 1 && best.score >= 80) {
    return best.notice.noticeId;
  }

  return null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isEmptyField(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function mergeMissingFields(
  current: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...current };

  for (const [key, value] of Object.entries(patch)) {
    if (isEmptyField(next[key])) {
      next[key] = value;
    }
  }

  return next;
}

function mergeNoticeUpdatePatch(
  current: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...current };

  for (const [key, value] of Object.entries(patch)) {
    if (!isEmptyField(value)) {
      next[key] = value;
    }
  }

  return next;
}

function isNoticeMutationActionType(type: string | undefined): boolean {
  return type === "UPDATE_NOTICE" || type === "DELETE_NOTICE";
}

export function enrichAnalysisWithNoticeFromLookup(
  analysis: AssistantAnalysis,
  message: string,
  toolResults: AssistantToolResultEntry[],
): AssistantAnalysis {
  if (!hasNoticeUpdateIntent(message) && !hasNoticeDeleteIntent(message)) {
    return analysis;
  }

  const noticeId = resolveNoticeIdFromLookup(message, toolResults);
  if (noticeId === null) {
    const lookedUp = toolResults.some(
      (result) => result.ok && result.toolId === LOOKUP_TOOL_ID,
    );
    if (lookedUp && hasNoticeDeleteIntent(message)) {
      const actionType = analysis.action?.type;
      if (!isNoticeMutationActionType(actionType)) {
        return {
          ...analysis,
          summary: analysis.summary.trim() || "삭제할 공지를 찾지 못했습니다.",
          admin_action_required: false,
          recommended_action: "",
          action: { type: "NONE" },
        };
      }
    }
    return analysis;
  }

  const actionType = hasNoticeDeleteIntent(message)
    ? "DELETE_NOTICE"
    : "UPDATE_NOTICE";
  const currentPayload = isPlainRecord(analysis.action?.payload)
    ? analysis.action.payload
    : {};
  const explicitPatch = {
    noticeId,
    ...extractNoticeFieldsFromMessage(message),
  };
  const prefilled =
    actionType === "UPDATE_NOTICE"
      ? mergeNoticeUpdatePatch(currentPayload, explicitPatch)
      : mergeMissingFields(currentPayload, explicitPatch);

  const matchTitle = extractNoticeMatchTitle(message);
  const summary =
    analysis.summary.trim() ||
    (actionType === "DELETE_NOTICE"
      ? matchTitle
        ? `'${matchTitle}' 공지(noticeId ${noticeId}) 삭제를 준비합니다.`
        : `공지 noticeId ${noticeId} 삭제를 준비합니다.`
      : matchTitle
        ? `'${matchTitle}' 공지(noticeId ${noticeId}) 수정을 준비합니다.`
        : `공지 noticeId ${noticeId} 수정을 준비합니다.`);

  return {
    ...analysis,
    admin_action_required: true,
    fallback_required: false,
    confidence: Math.max(analysis.confidence, 0.9),
    recommended_action:
      analysis.recommended_action.trim() ||
      "아래 내용을 확인한 뒤 승인하면 작업이 실행됩니다.",
    summary,
    action: {
      type: actionType,
      payload: prefilled,
    },
  };
}

export function hasPendingNoticeLookup(
  message: string,
  toolResults: AssistantToolResultEntry[],
): boolean {
  if (!hasNoticeUpdateIntent(message) && !hasNoticeDeleteIntent(message)) {
    return false;
  }
  if (extractNoticeIdFromMessage(message) !== null) {
    return false;
  }
  return !toolResults.some(
    (result) => result.ok && result.toolId === LOOKUP_TOOL_ID,
  );
}
