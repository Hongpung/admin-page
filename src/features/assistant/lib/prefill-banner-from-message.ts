import {
  hasBannerCreateIntent,
  hasBannerDeleteIntent,
  hasBannerUpdateIntent,
} from "@admin/features/assistant/lib/assistant-banner-intent";
import { parseBannerDateRangeFromMessage } from "@admin/features/assistant/lib/assistant-date-range";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";

const OWNER_STOP_WORDS = new Set([
  "배너",
  "등록",
  "생성",
  "수정",
  "삭제",
  "변경",
  "게시",
  "이미지",
  "링크",
]);

const URL_PATTERN = /https?:\/\/[^\s"'<>]+/g;

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

function normalizeToken(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function extractBannerOwnerFromMessage(message: string): string | null {
  const quoted = message.match(/["'「『]([^"'」』]{1,40})["'」』]/);
  if (quoted?.[1]?.trim()) {
    return quoted[1].trim();
  }

  const explicitOwner = message.match(
    /(?:owner|소유자|주체|신청자)(?:는|명|가)?\s*[:：]?\s*["']?([^"'\n,]{1,40})/i,
  );
  if (explicitOwner?.[1]?.trim()) {
    return explicitOwner[1].trim();
  }

  const ownerBanner = message.match(
    /([가-힣a-zA-Z][가-힣a-zA-Z0-9\s]{0,30}?)\s*(?:의\s*)?배너/,
  );
  const candidate = ownerBanner?.[1]?.trim();
  if (
    candidate &&
    !OWNER_STOP_WORDS.has(normalizeToken(candidate)) &&
    !/(?:수정|삭제|등록|생성|조회|목록)/.test(candidate)
  ) {
    return candidate;
  }

  return null;
}

export function extractBannerIdFromMessage(message: string): number | null {
  const explicitId = message.match(
    /(?:배너\s*)?(?:id|ID|아이디)\s*[:：]?\s*(\d+)/,
  );
  if (explicitId?.[1]) {
    return Number(explicitId[1]);
  }

  const shortId = message.match(/배너\s*(\d+)\s*(?:번|번째)?(?:을|를|의)?/);
  if (shortId?.[1]) {
    return Number(shortId[1]);
  }

  return null;
}

function extractUrls(message: string): { bannerImgUrl?: string; href?: string } {
  const urls = message.match(URL_PATTERN) ?? [];
  if (urls.length === 0) {
    return {};
  }

  const imageMatch = message.match(
    /(?:이미지|bannerImgUrl|배너\s*이미지)(?:\s*url|\s*주소)?\s*[:：]?\s*(https?:\/\/[^\s"'<>]+)/i,
  );
  const hrefMatch = message.match(
    /(?:링크|href|연결(?:\s*url)?)(?:\s*url|\s*주소)?\s*[:：]?\s*(https?:\/\/[^\s"'<>]+)/i,
  );

  const patch: { bannerImgUrl?: string; href?: string } = {};
  if (imageMatch?.[1]) {
    patch.bannerImgUrl = imageMatch[1];
  }
  if (hrefMatch?.[1]) {
    patch.href = hrefMatch[1];
  }

  if (!patch.bannerImgUrl && urls[0]) {
    patch.bannerImgUrl = urls[0];
  }
  if (!patch.href && urls.length >= 2) {
    const secondUrl = urls.find((url) => url !== patch.bannerImgUrl);
    if (secondUrl) {
      patch.href = secondUrl;
    }
  }

  return patch;
}

export function extractBannerFieldsFromMessage(
  message: string,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  const owner = extractBannerOwnerFromMessage(message);
  if (owner) patch.owner = owner;

  const bannerId = extractBannerIdFromMessage(message);
  if (bannerId != null && bannerId > 0) {
    patch.bannerId = bannerId;
  }

  const dateRange = parseBannerDateRangeFromMessage(message);
  if (dateRange.startDate) patch.startDate = dateRange.startDate;
  if (dateRange.endDate) patch.endDate = dateRange.endDate;

  Object.assign(patch, extractUrls(message));

  return patch;
}

const CREATE_ACTION_TYPES = new Set([
  "CREATE_BANNER",
  "UNKNOWN",
  "NONE",
]);

const UPDATE_ACTION_TYPES = new Set(["UPDATE_BANNER", "UNKNOWN", "NONE"]);

const DELETE_ACTION_TYPES = new Set(["DELETE_BANNER", "UNKNOWN", "NONE"]);

export function enrichAnalysisWithBannerMessagePrefill(
  analysis: AssistantAnalysis,
  message: string,
): AssistantAnalysis {
  const prefilledFields = extractBannerFieldsFromMessage(message);
  const actionType = analysis.action?.type;

  if (hasBannerCreateIntent(message)) {
    if (actionType && !CREATE_ACTION_TYPES.has(actionType)) {
      return analysis;
    }

    const currentPayload = isPlainRecord(analysis.action?.payload)
      ? analysis.action.payload
      : {};

    return {
      ...analysis,
      admin_action_required: true,
      action: {
        type: "CREATE_BANNER",
        payload: mergeMissingFields(currentPayload, prefilledFields),
      },
    };
  }

  if (hasBannerUpdateIntent(message)) {
    if (actionType && !UPDATE_ACTION_TYPES.has(actionType)) {
      return analysis;
    }

    const currentPayload = isPlainRecord(analysis.action?.payload)
      ? analysis.action.payload
      : {};

    return {
      ...analysis,
      admin_action_required: true,
      action: {
        type: "UPDATE_BANNER",
        payload: mergeMissingFields(currentPayload, prefilledFields),
      },
    };
  }

  if (hasBannerDeleteIntent(message)) {
    if (actionType && !DELETE_ACTION_TYPES.has(actionType)) {
      return analysis;
    }

    const currentPayload = isPlainRecord(analysis.action?.payload)
      ? analysis.action.payload
      : {};

    return {
      ...analysis,
      admin_action_required: true,
      action: {
        type: "DELETE_BANNER",
        payload: mergeMissingFields(currentPayload, prefilledFields),
      },
    };
  }

  return analysis;
}
