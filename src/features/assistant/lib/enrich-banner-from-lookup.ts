import {
  hasBannerDeleteIntent,
  hasBannerUpdateIntent,
  needsBannerLookupForMessage,
} from "@admin/features/assistant/lib/assistant-banner-intent";
import {
  extractBannerIdFromMessage,
  extractBannerOwnerFromMessage,
} from "@admin/features/assistant/lib/prefill-banner-from-message";
import type { AssistantToolResultEntry } from "@admin/features/assistant/lib/assistant-tool-loop";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";

type BannerLookupItem = {
  bannerId?: number | string;
  owner?: string;
};

const MUTATION_ACTION_TYPES = new Set(["UPDATE_BANNER", "DELETE_BANNER"]);

function normalizeToken(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toBannerId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return null;
}

function collectBannerLookupResults(
  toolResults: AssistantToolResultEntry[],
): BannerLookupItem[] {
  const entry = toolResults.find(
    (result) => result.ok && result.toolId === "banners_list_lookup" && result.data,
  );

  const banners = entry?.data?.banners;
  if (!Array.isArray(banners)) return [];
  return banners as BannerLookupItem[];
}

function scoreBannerMatch(banner: BannerLookupItem, query: string): number {
  const normalizedQuery = normalizeToken(query);
  const owner = normalizeToken(banner.owner ?? "");

  if (!normalizedQuery) return 0;
  if (owner === normalizedQuery) return 100;
  if (owner.includes(normalizedQuery) || normalizedQuery.includes(owner)) {
    return owner.length >= 2 ? 80 : 0;
  }
  return 0;
}

export function resolveBannerIdFromLookup(
  message: string,
  toolResults: AssistantToolResultEntry[],
): number | null {
  const explicitId = extractBannerIdFromMessage(message);
  if (explicitId != null && explicitId > 0) {
    return explicitId;
  }

  const ownerQuery = extractBannerOwnerFromMessage(message);
  if (!ownerQuery) return null;

  const banners = collectBannerLookupResults(toolResults);
  if (banners.length === 0) return null;

  const scored = banners
    .map((banner) => ({
      banner,
      score: scoreBannerMatch(banner, ownerQuery),
      bannerId: toBannerId(banner.bannerId),
    }))
    .filter((item) => item.bannerId != null && item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const best = scored[0];
  if (!best?.bannerId) return null;

  if (best.score >= 100) {
    const tied = scored.filter((item) => item.score === best.score);
    if (tied.length === 1) {
      return best.bannerId;
    }
  }

  if (banners.length === 1 && best.score >= 80) {
    return best.bannerId;
  }

  return null;
}

function shouldEnrichBannerId(
  analysis: AssistantAnalysis,
  message: string,
): boolean {
  const actionType = analysis.action?.type;
  if (actionType && MUTATION_ACTION_TYPES.has(actionType)) {
    const payload = analysis.action?.payload;
    if (isPlainRecord(payload) && typeof payload.bannerId === "number") {
      return false;
    }
    return true;
  }

  return hasBannerUpdateIntent(message) || hasBannerDeleteIntent(message);
}

export function enrichAnalysisWithBannerFromLookup(
  analysis: AssistantAnalysis,
  message: string,
  toolResults: AssistantToolResultEntry[],
): AssistantAnalysis {
  if (!shouldEnrichBannerId(analysis, message)) {
    return analysis;
  }

  const bannerId = resolveBannerIdFromLookup(message, toolResults);
  if (bannerId == null) {
    return analysis;
  }

  const actionType =
    analysis.action?.type && MUTATION_ACTION_TYPES.has(analysis.action.type)
      ? analysis.action.type
      : hasBannerDeleteIntent(message)
        ? "DELETE_BANNER"
        : "UPDATE_BANNER";
  const currentPayload = isPlainRecord(analysis.action?.payload)
    ? analysis.action.payload
    : {};
  const ownerQuery = extractBannerOwnerFromMessage(message);

  return {
    ...analysis,
    admin_action_required: true,
    fallback_required: false,
    confidence: Math.max(analysis.confidence, 0.85),
    action: {
      type: actionType,
      payload: {
        ...currentPayload,
        bannerId,
      },
    },
    summary:
      analysis.summary.trim() ||
      (ownerQuery
        ? `'${ownerQuery}' 배너(bannerId ${bannerId}) 작업을 준비합니다.`
        : `배너 bannerId ${bannerId}를 확인했습니다.`),
  };
}

export function hasPendingBannerLookup(
  message: string,
  toolResults: AssistantToolResultEntry[],
): boolean {
  if (!needsBannerLookupForMessage(message)) {
    return false;
  }
  if (extractBannerIdFromMessage(message) != null) {
    return false;
  }
  return !toolResults.some(
    (result) => result.ok && result.toolId === "banners_list_lookup",
  );
}
