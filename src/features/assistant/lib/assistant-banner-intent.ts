const READ_KEYWORDS =
  /(?:조회|불러|가져|알려|보여|확인|리스트|목록|있어|뭐야|몇\s*개|몇\s*건|모두|전부|다\s*보)/;

const DELETE_KEYWORDS = /(?:삭제|없애|지워|제거)/;

const UPDATE_KEYWORDS = /(?:수정|변경|업데이트|바꿔|고쳐)/;

const CREATE_MUTATION_KEYWORDS = /(?:등록|생성|추가|만들|올려|게시|배포)/;

import { extractBannerIdFromMessage } from "@admin/features/assistant/lib/prefill-banner-from-message";

function includesBanner(message: string): boolean {
  return message.replace(/\s+/g, "").includes("배너");
}

export function hasBannerDeleteIntent(message: string): boolean {
  if (!includesBanner(message)) return false;
  return DELETE_KEYWORDS.test(message.replace(/\s+/g, ""));
}

export function hasBannerReadIntent(message: string): boolean {
  const normalized = message.replace(/\s+/g, "");
  if (!normalized.includes("배너")) return false;
  if (hasBannerDeleteIntent(message)) return false;
  if (
    (UPDATE_KEYWORDS.test(normalized) || CREATE_MUTATION_KEYWORDS.test(normalized)) &&
    !READ_KEYWORDS.test(normalized)
  ) {
    return false;
  }
  return READ_KEYWORDS.test(normalized);
}

export function hasBannerUpdateIntent(message: string): boolean {
  const normalized = message.replace(/\s+/g, "");
  if (!normalized.includes("배너")) return false;
  if (hasBannerDeleteIntent(message)) return false;
  if (hasBannerReadIntent(message)) return false;
  return UPDATE_KEYWORDS.test(normalized);
}

export function hasBannerCreateIntent(message: string): boolean {
  const normalized = message.replace(/\s+/g, "");
  if (hasBannerDeleteIntent(message)) return false;
  if (hasBannerReadIntent(message)) return false;
  if (hasBannerUpdateIntent(message)) return false;

  if (/배너/.test(normalized) && CREATE_MUTATION_KEYWORDS.test(normalized)) {
    return true;
  }

  if (!normalized.includes("배너")) return false;
  return CREATE_MUTATION_KEYWORDS.test(normalized);
}

export function needsBannerLookupForMessage(message: string): boolean {
  if (!includesBanner(message)) return false;
  if (!hasBannerUpdateIntent(message) && !hasBannerDeleteIntent(message)) {
    return false;
  }
  if (extractBannerIdFromMessage(message) != null) {
    return false;
  }
  return true;
}
