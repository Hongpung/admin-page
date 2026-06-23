import {
  extractNoticeIdFromMessage,
  hasNoticeCreateIntent,
  hasNoticeDeleteIntent,
  hasNoticeUpdateIntent,
} from "@admin/features/assistant/lib/assistant-notice-intent";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";

const NOTICE_TITLE_STOP_WORDS = new Set([
  "공지",
  "제목",
  "내용",
  "전체",
  "알림",
  "수정",
  "삭제",
  "등록",
  "생성",
]);

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

function mergeExplicitPatchFields(
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

function extractQuotedStrings(message: string): string[] {
  const matches = Array.from(
    message.matchAll(/["'「『]([^"'」』]{1,80})["'」』]/g),
  );
  return Array.from(matches, (match) => match[1]?.trim() ?? "").filter(Boolean);
}

function isUsableNoticeTitle(value: string): boolean {
  const normalized = value.replace(/\s+/g, "");
  if (normalized.length < 2 || normalized.length > 80) return false;
  return !NOTICE_TITLE_STOP_WORDS.has(normalized);
}

function extractExplicitTitle(message: string): string | null {
  const labeled = message.match(
    /제목(?:은|이|가|:)\s*["'「『]?([^"'」』\n]{2,80})["'」』]?/,
  );
  const candidate = labeled?.[1]?.trim();
  if (candidate && isUsableNoticeTitle(candidate)) {
    return candidate.replace(/[,.]$/, "").trim();
  }
  return null;
}

function extractExplicitContent(message: string): string | null {
  const labeled = message.match(
    /내용(?:은|을|이|가|:)\s*["'「『]?([^"'」』\n]+?)["'」』]?(?=(?:전체|알림|$))/,
  );
  const candidate = labeled?.[1]?.trim();
  if (candidate && candidate.length >= 2) {
    return candidate.replace(/[,.]$/, "").trim();
  }
  return null;
}

function parseNoticeAll(message: string): boolean | null {
  const normalized = message.replace(/\s+/g, "");
  if (
    /전체(?:알림|회원|푸시|공지)|알림(?:발송|보내|켜)|푸시(?:발송|보내)/.test(
      normalized,
    )
  ) {
    return true;
  }
  if (/알림(?:안|없|미발송|끄|비활성)|전체알림(?:안|없|끄)/.test(normalized)) {
    return false;
  }
  return null;
}

export function extractNoticeMatchTitle(message: string): string | null {
  if (extractNoticeIdFromMessage(message) !== null) {
    return null;
  }

  if (hasNoticeUpdateIntent(message) || hasNoticeDeleteIntent(message)) {
    const noticeQuoted = message.match(
      /공지\s*['"「『]([^"'」』]{1,80})['"」』]/,
    );
    const noticeCandidate = noticeQuoted?.[1]?.trim();
    if (noticeCandidate && isUsableNoticeTitle(noticeCandidate)) {
      return noticeCandidate;
    }

    const patchTitle = extractUpdatePatchTitle(message);
    for (const candidate of extractQuotedStrings(message)) {
      if (patchTitle && candidate === patchTitle) continue;
      if (isUsableNoticeTitle(candidate)) {
        return candidate;
      }
    }
  }

  const explicit = extractExplicitTitle(message);
  if (explicit) return explicit;

  const quoted = extractQuotedStrings(message);
  for (const candidate of quoted) {
    if (isUsableNoticeTitle(candidate)) {
      return candidate;
    }
  }

  const titledNotice = message.match(
    /([가-힣a-zA-Z0-9][가-힣a-zA-Z0-9\s._-]{1,40})\s*공지/,
  );
  const suffixCandidate = titledNotice?.[1]?.trim();
  if (suffixCandidate && isUsableNoticeTitle(suffixCandidate)) {
    return suffixCandidate;
  }

  const noticeTitle = message.match(
    /공지\s*['"「『]?([가-힣a-zA-Z0-9][가-힣a-zA-Z0-9\s._-]{1,40})['"」』]?(?:\s*(?:을|를|이|가))?/,
  );
  const prefixCandidate = noticeTitle?.[1]?.trim();
  if (prefixCandidate && isUsableNoticeTitle(prefixCandidate)) {
    return prefixCandidate.replace(/(?:을|를|이|가)$/, "").trim();
  }

  return null;
}

function extractUpdatePatchTitle(message: string): string | null {
  const patch = message.match(
    /제목(?:을|를)\s*["'「『]([^"'」』]{2,80})["'」』](?:으로|로)?/,
  );
  const candidate = patch?.[1]?.trim();
  if (candidate && isUsableNoticeTitle(candidate)) {
    return candidate;
  }
  return null;
}

function extractUpdatePatchContent(message: string): string | null {
  const patch = message.match(
    /내용(?:을|를)\s*["'「『]?([^"'」』\n]+?)["'」』]?(?=(?:전체|알림|$))/,
  );
  const candidate = patch?.[1]?.trim();
  if (candidate && candidate.length >= 2) {
    return candidate.replace(/[,.]$/, "").trim();
  }
  return null;
}

export function extractNoticeFieldsFromMessage(
  message: string,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  const noticeId = extractNoticeIdFromMessage(message);
  if (noticeId !== null) {
    patch.noticeId = noticeId;
  }

  const noticeAll = parseNoticeAll(message);
  if (noticeAll !== null) {
    patch.noticeAll = noticeAll;
  }

  if (hasNoticeUpdateIntent(message)) {
    const updateTitle = extractUpdatePatchTitle(message);
    if (updateTitle) patch.title = updateTitle;

    const updateContent = extractUpdatePatchContent(message);
    if (updateContent) patch.content = updateContent;

    return patch;
  }

  if (hasNoticeDeleteIntent(message)) {
    return patch;
  }

  const title = extractExplicitTitle(message) ?? extractNoticeMatchTitle(message);
  if (title) patch.title = title;

  const content = extractExplicitContent(message);
  if (content) patch.content = content;

  return patch;
}

const CREATE_ACTION_TYPES = new Set([
  "CREATE_NOTICE",
  "UNKNOWN",
  "NONE",
]);

const UPDATE_ACTION_TYPES = new Set(["UPDATE_NOTICE", "UNKNOWN", "NONE"]);
const DELETE_ACTION_TYPES = new Set(["DELETE_NOTICE", "UNKNOWN", "NONE"]);

export function enrichAnalysisWithNoticeMessagePrefill(
  analysis: AssistantAnalysis,
  message: string,
): AssistantAnalysis {
  if (hasNoticeCreateIntent(message)) {
    const actionType = analysis.action?.type;
    if (actionType && !CREATE_ACTION_TYPES.has(actionType)) {
      return analysis;
    }

    const currentPayload = isPlainRecord(analysis.action?.payload)
      ? analysis.action.payload
      : {};
    const prefilled = mergeExplicitPatchFields(
      currentPayload,
      extractNoticeFieldsFromMessage(message),
    );

    return {
      ...analysis,
      admin_action_required: true,
      action: {
        type: "CREATE_NOTICE",
        payload: prefilled,
      },
    };
  }

  if (hasNoticeUpdateIntent(message)) {
    const actionType = analysis.action?.type;
    if (actionType && !UPDATE_ACTION_TYPES.has(actionType)) {
      return analysis;
    }

    const currentPayload = isPlainRecord(analysis.action?.payload)
      ? analysis.action.payload
      : {};
    const prefilled = mergeMissingFields(
      currentPayload,
      extractNoticeFieldsFromMessage(message),
    );

    return {
      ...analysis,
      admin_action_required: true,
      action: {
        type: "UPDATE_NOTICE",
        payload: prefilled,
      },
    };
  }

  if (hasNoticeDeleteIntent(message)) {
    const actionType = analysis.action?.type;
    if (actionType && !DELETE_ACTION_TYPES.has(actionType)) {
      return analysis;
    }

    const currentPayload = isPlainRecord(analysis.action?.payload)
      ? analysis.action.payload
      : {};
    const prefilled = mergeMissingFields(
      currentPayload,
      extractNoticeFieldsFromMessage(message),
    );

    return {
      ...analysis,
      admin_action_required: true,
      action: {
        type: "DELETE_NOTICE",
        payload: prefilled,
      },
    };
  }

  return analysis;
}
