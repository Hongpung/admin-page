const READ_KEYWORDS =
  /(?:조회|불러|가져|알려|보여|확인|리스트|목록|있어|뭐야|몇\s*개|몇\s*건|모두|전부|다\s*보)/;

const CANCEL_KEYWORDS = /(?:취소|삭제|없애|지워)/;

const UPDATE_KEYWORDS = /(?:수정|변경|바꿔|고쳐|연장|단축|업데이트)/;

const CREATE_MUTATION_KEYWORDS =
  /(?:등록|생성|추가|만들|예약해|잡아|넣어|배치)/;

function hasBareMonthListBulkPattern(normalized: string): boolean {
  return /^(?:(?:\d{4}년)?\d{1,2}월)+다$/.test(normalized);
}

/** "9월 10월 11월 12월 다"처럼 월 나열 + 전체 취소 의도 */
export function hasMonthBulkCancelPattern(message: string): boolean {
  if (!/(?:\d{4}\s*년\s*)?\d{1,2}\s*월/.test(message)) {
    return false;
  }

  const normalized = message.replace(/\s+/g, "");
  if (CANCEL_KEYWORDS.test(normalized)) return true;
  if (/(?:전부|모두|전체|일괄)/.test(normalized)) return true;
  if (hasBareMonthListBulkPattern(normalized)) return true;

  return false;
}

export function hasReservationCancelIntent(message: string): boolean {
  if (hasMonthBulkCancelPattern(message)) return true;

  const normalized = message.replace(/\s+/g, "");
  if (!normalized.includes("예약")) return false;
  return CANCEL_KEYWORDS.test(normalized);
}

export function hasReservationUpdateIntent(message: string): boolean {
  if (hasReservationCancelIntent(message)) return false;

  const normalized = message.replace(/\s+/g, "");
  if (!UPDATE_KEYWORDS.test(normalized)) return false;

  return (
    normalized.includes("예약") ||
    normalized.includes("연습") ||
    /(?:종료|시작|시간|까지|시반|반까지)/.test(normalized) ||
    /\d{1,2}\s*시/.test(message)
  );
}

export function hasReservationReadIntent(message: string): boolean {
  const normalized = message.replace(/\s+/g, "");
  if (!normalized.includes("예약")) return false;
  if (hasReservationCancelIntent(message)) return false;
  if (hasReservationUpdateIntent(message)) return false;
  if (CREATE_MUTATION_KEYWORDS.test(normalized) && !READ_KEYWORDS.test(normalized)) {
    return false;
  }
  return READ_KEYWORDS.test(normalized);
}

export function needsReservationUpdateLookupForMessage(message: string): boolean {
  if (!hasReservationUpdateIntent(message)) return false;
  return true;
}

export function needsReservationLookupForMessage(message: string): boolean {
  if (hasMonthBulkCancelPattern(message)) return true;
  if (hasReservationUpdateIntent(message)) return true;

  const normalized = message.replace(/\s+/g, "");
  if (!normalized.includes("예약")) return false;
  return (
    hasReservationReadIntent(message) ||
    hasReservationCancelIntent(message)
  );
}

export function hasReservationBatchCreateIntent(message: string): boolean {
  const normalized = message.replace(/\s+/g, "");
  if (
    hasReservationCancelIntent(message) ||
    hasReservationReadIntent(message) ||
    hasReservationUpdateIntent(message)
  ) {
    return false;
  }

  const hasRecurringSchedule =
    /매\s*주|매\s*월|반\s*복|배\s*치/.test(normalized) ||
    (/(?:월|화|수|목|금|토|일)\s*요\s*일/.test(normalized) &&
      /(?:다\s*음\s*달|이\s*번\s*달)\s*까\s*지/.test(normalized));

  if (!hasRecurringSchedule) return false;

  return /연습|예약|정기|주최|잡|등록|생성|만들|넣|배치/.test(normalized);
}

export function hasReservationCreateIntent(message: string): boolean {
  const normalized = message.replace(/\s+/g, "");
  if (hasReservationCancelIntent(message)) return false;
  if (hasReservationUpdateIntent(message)) return false;
  if (hasReservationReadIntent(message)) return false;

  if (hasReservationBatchCreateIntent(message)) return true;

  if (/연습/.test(normalized) && /(?:생성|등록|만들|잡아|넣어)/.test(normalized)) {
    return true;
  }

  if (!normalized.includes("예약")) return false;
  if (CREATE_MUTATION_KEYWORDS.test(normalized)) return true;
  if (
    /(?:예약자|예약을|으로예약|로예약|시예약|분예약|시간예약|한시간예약)/.test(
      normalized,
    )
  ) {
    return true;
  }
  return /예약$/.test(normalized) || /예약[^\s]*$/.test(message.trim());
}
