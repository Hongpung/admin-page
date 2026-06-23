import { hasReservationCreateIntent } from "@admin/features/assistant/lib/assistant-reservation-intent";
import { extractMemberNamesFromMultiReservationText } from "@admin/features/assistant/lib/parse-multi-reservations-from-text";

const RESERVED_CREATOR_TOKENS = new Set([
  "내일",
  "모레",
  "오늘",
  "이번",
  "다음",
  "지난",
  "정기",
  "연습",
  "예약",
  "예약자",
  "오후",
  "오전",
  "한시간",
  "시간",
  "부터",
  "까지",
  "전부",
  "모두",
  "일반",
  "외부",
  "공통",
]);

function isLikelyPersonName(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 12) return false;
  if (RESERVED_CREATOR_TOKENS.has(trimmed)) return false;
  if (/^\d+$/.test(trimmed)) return false;
  return /^[가-힣a-zA-Z][가-힣a-zA-Z0-9._-]*$/.test(trimmed);
}

function pickFirstName(
  matches: Array<RegExpMatchArray | null>,
): string | null {
  for (const match of matches) {
    const candidate = match?.[1]?.trim();
    if (candidate && isLikelyPersonName(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function extractReservationCreatorName(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  const isReservationContext =
    /(?:예약|연습|주최자|생성|등록|잡아)/.test(trimmed);
  if (!isReservationContext) return null;

  return pickFirstName([
    trimmed.match(
      /([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,11})\s*(?:님\s*)?(?:을|를)\s*주최자/,
    ),
    trimmed.match(
      /([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,11})\s+주최자(?:로|으로)?/,
    ),
    trimmed.match(/주최자\s*(?:로\s*)?([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,11})/),
    trimmed.match(
      /([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,11})\s*(?:님\s*)?(?:을|를)\s*예약자/,
    ),
    trimmed.match(/예약자\s*(?:로\s*)?([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,11})/),
    trimmed.match(
      /([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,11})\s*님(?:으로|이)?\s*(?:예약|잡)/,
    ),
    trimmed.match(
      /([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,11})\s*(?:이름|닉네임)으로/,
    ),
    trimmed.match(
      /([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,11})\s*(?:회원|멤버)(?:으로|로)?/,
    ),
    trimmed.match(
      /([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,11})\s*에게\s*(?:예약|잡)/,
    ),
  ]);
}

export function hasMemberSearchIntent(message: string): boolean {
  const normalized = message.replace(/\s+/g, "");
  if (!normalized) return false;

  if (
    /(?:회원|멤버|사용자|유저)/.test(normalized) &&
    /(?:찾|검색|조회|탐색|목록|리스트|보여|알려|누구)/.test(normalized)
  ) {
    return true;
  }

  if (/(?:찾아|검색해|누구)/.test(normalized) && extractMemberSearchUsername(message)) {
    return true;
  }

  return /(?:creatorId|memberId|멤버id|회원id)/i.test(normalized);
}

export function needsMemberLookupForMessage(message: string): boolean {
  if (hasMemberSearchIntent(message)) return true;
  if (extractMemberNamesFromMultiReservationText(message).length > 0) return true;
  if (!hasReservationCreateIntent(message)) return false;
  return Boolean(extractReservationCreatorName(message));
}

export function extractMemberSearchUsername(message: string): string | null {
  const reservationCreator = extractReservationCreatorName(message);
  if (reservationCreator) {
    return reservationCreator;
  }

  const quoted =
    message.match(/["'「『]([^"'」』]{2,20})["'」』]/) ??
    message.match(/["']([^"']{2,20})["']/);
  if (quoted?.[1]?.trim()) {
    return quoted[1].trim();
  }

  const nameBeforeVerb = message.match(
    /([가-힣a-zA-Z]{2,10})\s*(?:회원|멤버)?\s*(?:을|를|이|가)?\s*(?:찾|검색)/,
  );
  if (nameBeforeVerb?.[1]?.trim()) {
    return nameBeforeVerb[1].trim();
  }

  const nameAfterLabel = message.match(
    /(?:이름|성함)\s*(?:이|가)?\s*([가-힣a-zA-Z]{2,10})/,
  );
  if (nameAfterLabel?.[1]?.trim()) {
    return nameAfterLabel[1].trim();
  }

  return null;
}

export function resolveMemberLookupUsername(message: string): string | null {
  return extractMemberSearchUsername(message) ?? extractReservationCreatorName(message);
}
