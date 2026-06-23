import { ASSISTANT_CLUB_NAMES } from "@admin/features/assistant/constants/assistant-clubs";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function matchAssistantClubNameFromText(text: string): string | null {
  const normalized = text.replace(/\s+/g, "");
  if (!normalized) return null;

  for (const clubName of ASSISTANT_CLUB_NAMES) {
    if (normalized.includes(clubName)) {
      return clubName;
    }
  }

  return null;
}

export function extractClubNameFromPracticeTitle(title: string): string | null {
  const trimmed = title.trim();
  const patterns = [
    /^(.+?)의\s*정기\s*연습$/,
    /^(.+?)의\s*정규\s*예약$/,
    /^(.+?)의\s*정기\s*예약$/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  return null;
}

export function extractBatchClubName(
  payload: Record<string, unknown>,
  sourceText?: string,
): string | null {
  const option = isPlainRecord(payload.batchReservationOption)
    ? payload.batchReservationOption
    : {};

  for (const value of [
    option.clubName,
    option.creatorName,
    payload.clubName,
    payload.creatorName,
  ]) {
    if (typeof value === "string" && value.trim()) {
      const matched = matchAssistantClubNameFromText(value);
      return matched ?? value.trim();
    }
  }

  for (const value of [option.title, payload.title]) {
    if (typeof value !== "string" || !value.trim()) continue;
    const fromTitle = extractClubNameFromPracticeTitle(value.trim());
    if (fromTitle) {
      const matched = matchAssistantClubNameFromText(fromTitle);
      return matched ?? fromTitle;
    }
  }

  if (sourceText?.trim()) {
    return matchAssistantClubNameFromText(sourceText);
  }

  return null;
}

export function hasClubRegularReservationIntent(message: string): boolean {
  const normalized = message.replace(/\s+/g, "");
  if (!normalized) return false;

  return (
    /(?:정규\s*예약|정기\s*예약|정기\s*연습|동아리\s*정기|정기예약)/.test(
      normalized,
    ) ||
    matchAssistantClubNameFromText(normalized) !== null ||
    /패짱/.test(normalized)
  );
}
