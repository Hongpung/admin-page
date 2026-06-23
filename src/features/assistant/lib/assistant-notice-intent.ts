const READ_KEYWORDS =
  /(?:조회|불러|가져|알려|보여|확인|리스트|목록|있어|뭐야|몇\s*개|몇\s*건|모두|전부|다\s*보)/;

const DELETE_KEYWORDS = /(?:삭제|지워|없애|제거)/;
const UPDATE_KEYWORDS = /(?:수정|변경|바꿔|고쳐|업데이트)/;
const CREATE_KEYWORDS = /(?:등록|생성|추가|만들|작성|올려|게시|써|적어)/;

function normalizedMessage(message: string): string {
  return message.replace(/\s+/g, "");
}

export function hasNoticeContext(message: string): boolean {
  return normalizedMessage(message).includes("공지");
}

export function hasNoticeReadIntent(message: string): boolean {
  const normalized = normalizedMessage(message);
  if (!normalized.includes("공지")) return false;
  if (hasNoticeDeleteIntent(message) || hasNoticeUpdateIntent(message)) {
    return false;
  }
  if (CREATE_KEYWORDS.test(normalized) && !READ_KEYWORDS.test(normalized)) {
    return false;
  }
  return READ_KEYWORDS.test(normalized);
}

export function hasNoticeDeleteIntent(message: string): boolean {
  const normalized = normalizedMessage(message);
  if (!normalized.includes("공지")) return false;
  return DELETE_KEYWORDS.test(normalized);
}

export function hasNoticeUpdateIntent(message: string): boolean {
  const normalized = normalizedMessage(message);
  if (!normalized.includes("공지")) return false;
  if (hasNoticeDeleteIntent(message)) return false;
  return UPDATE_KEYWORDS.test(normalized);
}

export function hasNoticeCreateIntent(message: string): boolean {
  const normalized = normalizedMessage(message);
  if (!normalized.includes("공지")) return false;
  if (hasNoticeDeleteIntent(message) || hasNoticeUpdateIntent(message)) {
    return false;
  }
  if (hasNoticeReadIntent(message)) return false;
  if (CREATE_KEYWORDS.test(normalized)) return true;

  return /(?:제목|내용)/.test(normalized);
}

export function extractNoticeIdFromMessage(message: string): number | null {
  const patterns = [
    /공지\s*(?:id|ID|아이디)\s*[:#]?\s*(\d{1,9})/i,
    /(?:id|ID|아이디)\s*[:#]?\s*(\d{1,9})\s*(?:번\s*)?공지/,
    /공지\s*(\d{1,9})\s*번/,
    /#(\d{1,9})\s*공지/,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (!match) continue;
    const id = Number(match[1]);
    if (Number.isInteger(id) && id > 0) return id;
  }

  return null;
}

export function needsNoticeLookupForMessage(message: string): boolean {
  if (!hasNoticeUpdateIntent(message) && !hasNoticeDeleteIntent(message)) {
    return false;
  }
  if (extractNoticeIdFromMessage(message) !== null) {
    return false;
  }
  return true;
}
