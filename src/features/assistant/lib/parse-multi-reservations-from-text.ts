import {
  getKstDateParts,
  toYmd,
} from "@admin/features/assistant/lib/assistant-date-range";
import {
  addDurationToTime,
  parseDurationMinutes,
  parseKoreanClock,
  resolveRelativeDate,
  snapToTimeFormat,
} from "@admin/features/assistant/lib/prefill-message-utils";
import type { TimeFormat } from "@admin/features/reservation/constants/constants";

export type ParsedMultiReservationSlot = {
  date: string;
  startTime: TimeFormat;
  endTime: TimeFormat;
  title: string;
  reservationType: "COMMON" | "REGULAR" | "EXTERNAL";
  creatorName: string;
  participationAvailable: boolean;
};

const SLOT_LINE_PATTERN =
  /(?:(?:내일|모레|오늘)(?:\([^)]+\))?|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})?\s*(\d{1,2}:\d{2})\s*[~\-–]\s*(\d{1,2}:\d{2})\s*,\s*([^,]+?)\s*,\s*(.+)$/;

function resolveDateFromLine(line: string, fallbackDate: string | null): string | null {
  const relative = resolveRelativeDate(line);
  if (relative) return relative;

  const mdInParen = line.match(/\((\d{1,2})\/(\d{1,2})\)/);
  const md = mdInParen ?? line.match(/(?:^|\s)(\d{1,2})\/(\d{1,2})(?:\s|,)/);
  if (md?.[1] && md?.[2]) {
    const year = getKstDateParts().year;
    return toYmd({
      year,
      month: Number(md[1]),
      day: Number(md[2]),
    });
  }

  return fallbackDate;
}

function parseTitleAndType(label: string): {
  title: string;
  reservationType: "COMMON" | "REGULAR" | "EXTERNAL";
} {
  const normalized = label.replace(/\s+/g, "");

  if (/외부/.test(normalized)) {
    const title = label.replace(/외부\s*예약?/g, "").trim();
    return {
      title: title || "외부예약",
      reservationType: "EXTERNAL",
    };
  }

  if (/일반/.test(normalized)) {
    return {
      title: label.includes("연습") ? label.trim() : "일반연습",
      reservationType: "COMMON",
    };
  }

  if (/정기/.test(normalized)) {
    return {
      title: label.includes("연습") ? label.trim() : "정기연습",
      reservationType: "REGULAR",
    };
  }

  return {
    title: label.trim(),
    reservationType: "REGULAR",
  };
}

function snapClockToTimeFormat(clock: string): TimeFormat | null {
  const match = clock.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return snapToTimeFormat(Number(match[1]), Number(match[2]));
}

function parseSlotLine(
  line: string,
  fallbackDate: string | null,
): ParsedMultiReservationSlot | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const match = trimmed.match(SLOT_LINE_PATTERN);
  if (!match?.[1] || !match?.[2] || !match?.[3] || !match?.[4]) {
    return null;
  }

  const startTime = snapClockToTimeFormat(match[1]);
  const endTime = snapClockToTimeFormat(match[2]);
  const date = resolveDateFromLine(trimmed, fallbackDate);
  if (!startTime || !endTime || !date) {
    return null;
  }

  const creatorName = match[3].trim();
  const { title, reservationType } = parseTitleAndType(match[4].trim());

  return {
    date,
    startTime,
    endTime,
    title,
    reservationType,
    creatorName,
    participationAvailable: false,
  };
}

function splitNaturalLanguageClauses(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?:해\s*주고|해주고|추가\s*해\s*주고|등록\s*해\s*주고|잡아\s*주고|,\s*)/)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function extractCreatorNameFromTitle(title: string): string {
  const ownerMatch = title.match(/^([가-힣a-zA-Z][가-힣a-zA-Z0-9._-]{1,11})의\s*\S/);
  return ownerMatch?.[1]?.trim() ?? "";
}

function extractExternalTitle(clause: string): string | null {
  const patterns = [
    /외부\s*예약(?:으로|로)?\s*(.+?)\s*(?:라는|이란)\s*이름/,
    /외부\s*예약(?:으로|로)?\s*(.+?)\s*예약/,
  ];

  for (const pattern of patterns) {
    const title = clause.match(pattern)?.[1]?.trim();
    if (title) return title;
  }

  return null;
}

function extractInternalTitle(clause: string): string | null {
  const title = clause.match(
    /(.+?)(?:으로|로)\s*(?:(?:오늘|내일|모레|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})\s*)?(?:오전|오후)?\s*\d{1,2}\s*시/,
  )?.[1]?.trim();

  if (!title) return null;
  return title.replace(/^(?:일반|정기)\s*예약(?:으로|로)?\s*/, "").trim();
}

function parseNaturalLanguageClause(
  clause: string,
  fallbackDate: string | null,
): ParsedMultiReservationSlot | null {
  const date = resolveDateFromLine(clause, fallbackDate);
  const clock = parseKoreanClock(clause);
  if (!date || !clock) return null;

  const startTime = snapToTimeFormat(clock.hour, clock.minute);
  const durationMinutes = parseDurationMinutes(clause);
  const endTime =
    startTime && durationMinutes
      ? addDurationToTime(startTime, durationMinutes)
      : null;
  if (!startTime || !endTime) return null;

  const isExternal = /외부\s*예약/.test(clause);
  const title = isExternal ? extractExternalTitle(clause) : extractInternalTitle(clause);
  if (!title) return null;

  const creatorName = isExternal ? title : extractCreatorNameFromTitle(title);
  if (!creatorName) return null;

  return {
    date,
    startTime,
    endTime,
    title,
    reservationType: isExternal ? "EXTERNAL" : "REGULAR",
    creatorName,
    participationAvailable: false,
  };
}

function parseNaturalLanguageReservations(
  combined: string,
  fallbackDate: string | null,
): ParsedMultiReservationSlot[] {
  return splitNaturalLanguageClauses(combined)
    .map((clause) => parseNaturalLanguageClause(clause, fallbackDate))
    .filter((slot): slot is ParsedMultiReservationSlot => slot !== null);
}

export function parseMultiReservationsFromText(
  ...sources: string[]
): ParsedMultiReservationSlot[] {
  const combined = sources.filter(Boolean).join("\n");
  if (!combined.trim()) return [];

  const fallbackDate = resolveRelativeDate(combined);
  const lines = combined
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const slots: ParsedMultiReservationSlot[] = [];
  for (const line of lines) {
    const slot = parseSlotLine(line, fallbackDate);
    if (slot) {
      slots.push(slot);
    }
  }

  if (slots.length >= 2) {
    return slots;
  }

  const naturalLanguageSlots = parseNaturalLanguageReservations(
    combined,
    fallbackDate,
  );
  return naturalLanguageSlots.length >= 2 ? naturalLanguageSlots : slots;
}

export function hasMultiReservationCreateIntent(...sources: string[]): boolean {
  return parseMultiReservationsFromText(...sources).length >= 2;
}

export function extractMemberNamesFromMultiReservationText(
  ...sources: string[]
): string[] {
  const names = new Set<string>();
  for (const slot of parseMultiReservationsFromText(...sources)) {
    if (slot.reservationType !== "EXTERNAL" && slot.creatorName) {
      names.add(slot.creatorName);
    }
  }
  return Array.from(names);
}

export function toMultiReservationPayload(
  slots: ParsedMultiReservationSlot[],
): Record<string, unknown>[] {
  return slots.map((slot) => {
    const base = {
      title: slot.title,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      participationAvailable: slot.participationAvailable,
      reservationType: slot.reservationType,
      creatorName: slot.creatorName,
    };

    if (slot.reservationType === "EXTERNAL") {
      return {
        ...base,
        externalCreatorName: slot.creatorName,
      };
    }

    return base;
  });
}
