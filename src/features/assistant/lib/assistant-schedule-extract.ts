import { clampAssistantReservationEndTime } from "./clamp-reservation-end-time";

export type ScheduleRow = {
  day: string;
  clubName: string;
  startTime: string;
  endTime: string;
};

const SCHEDULE_DAY_PATTERN = "[월화수목금토일]";

function toYmdDate(year: string, month: string, day: string): string {
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function getLastDayOfMonth(year: number, month: number): string {
  return String(new Date(year, month, 0).getDate());
}

export function extractScheduleDurationFromText(
  text: string,
): { startDate: string; endDate: string } | null {
  const fullDates = Array.from(
    text.matchAll(
      /(\d{4})(?:\s*년|\s+|[-/.])\s*(\d{1,2})(?:\s*월|\s+|[-/.])\s*(\d{1,2})(?:\s*일)?/g,
    ),
  );

  if (fullDates.length >= 2) {
    const start = fullDates[0]!;
    const end = fullDates[1]!;
    return {
      startDate: toYmdDate(start[1]!, start[2]!, start[3]!),
      endDate: toYmdDate(end[1]!, end[2]!, end[3]!),
    };
  }

  if (fullDates.length === 1) {
    const start = fullDates[0]!;
    const shortDates = Array.from(
      text.matchAll(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/g),
    );
    const end = shortDates.at(-1);
    if (end) {
      return {
        startDate: toYmdDate(start[1]!, start[2]!, start[3]!),
        endDate: toYmdDate(start[1]!, end[1]!, end[2]!),
      };
    }

    const monthEnd = text.match(/(\d{1,2})\s*월\s*(?:마지막\s*날|말)/);
    if (monthEnd) {
      const year = Number(start[1]);
      const month = Number(monthEnd[1]);
      return {
        startDate: toYmdDate(start[1]!, start[2]!, start[3]!),
        endDate: toYmdDate(
          start[1]!,
          monthEnd[1]!,
          getLastDayOfMonth(year, month),
        ),
      };
    }
  }

  return null;
}

function normalizeClubNameFromOcr(value: string): string {
  return value
    .replace(/학회(?=들녘)/g, "학회 ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSkippableScheduleClubName(clubName: string): boolean {
  return /홍풍\s*어플|예약\s*후\s*사용/.test(clubName);
}

function pushScheduleRow(
  rows: ScheduleRow[],
  row: ScheduleRow,
): void {
  const normalizedRow: ScheduleRow = {
    ...row,
    endTime: clampAssistantReservationEndTime(row.endTime),
  };
  const duplicate = rows.some(
    (existing) =>
      existing.day === normalizedRow.day &&
      existing.startTime === normalizedRow.startTime &&
      existing.endTime === normalizedRow.endTime &&
      existing.clubName === normalizedRow.clubName,
  );
  if (!duplicate) {
    rows.push(normalizedRow);
  }
}

function extractInlineColonScheduleRows(detectedText: string): ScheduleRow[] {
  const rows: ScheduleRow[] = [];

  for (const match of Array.from(
    detectedText.matchAll(
      new RegExp(
        `(?:^|[\\s,])(${SCHEDULE_DAY_PATTERN})(?:\\s*요\\s*일)?\\s*[:：]\\s*(.+?)\\s*\\((\\d{1,2}:\\d{2})\\s*[~～-]\\s*(\\d{1,2}:\\d{2})\\)`,
        "g",
      ),
    ),
  )) {
    const clubName = match[2]?.replace(/,\s*$/, "").trim();
    if (!clubName || isSkippableScheduleClubName(clubName)) continue;

    pushScheduleRow(rows, {
      day: match[1]!,
      clubName: normalizeClubNameFromOcr(clubName),
      startTime: match[3]!,
      endTime: match[4]!,
    });
  }

  return rows;
}

export function extractScheduleRowsFromDetectedText(
  detectedText: string,
): ScheduleRow[] {
  const rows: ScheduleRow[] = [];

  for (const match of Array.from(
    detectedText.matchAll(
      /([월화수목금])(?:\s*요\s*일|요일)\s+(.{1,80}?)\s+(\d{1,2}:\d{2})\s*[~～-]\s*(\d{1,2}:\d{2})/g,
    ),
  )) {
    const clubName = match[2]?.replace(/,\s*$/, "").trim();
    if (!clubName || isSkippableScheduleClubName(clubName)) continue;

    pushScheduleRow(rows, {
      day: match[1]!,
      clubName: normalizeClubNameFromOcr(clubName),
      startTime: match[3]!,
      endTime: match[4]!,
    });
  }

  if (rows.length > 0) {
    return rows;
  }

  const inlineRows = extractInlineColonScheduleRows(detectedText);
  if (inlineRows.length > 0) {
    return inlineRows;
  }

  for (const rawLine of detectedText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || /홍풍\s*어플|예약\s*후\s*사용|요일\s*[월화수목금토일]/.test(line)) {
      continue;
    }

    const colonParenMatch = line.match(
      /^([월화수목금토일])(?:\s*요\s*일)?\s*[:：]\s*(.+?)\s*\((\d{1,2}:\d{2})\s*[~～-]\s*(\d{1,2}:\d{2})\)/,
    );
    const colonMatch =
      colonParenMatch ??
      line.match(
        /^([월화수목금토일])(?:\s*요\s*일)?\s*[:：]\s*(.+?)\s*,?\s*(\d{1,2}:\d{2})\s*[~～-]\s*(\d{1,2}:\d{2})/,
      );
    const spacedMatch =
      colonMatch ??
      line.match(
        /^([월화수목금토일])(?:\s*요\s*일)?\s+(.+?)\s+(\d{1,2}:\d{2})\s*[~～-]\s*(\d{1,2}:\d{2})/,
      );

    if (!spacedMatch) continue;

    pushScheduleRow(rows, {
      day: spacedMatch[1]!,
      clubName: normalizeClubNameFromOcr(
        spacedMatch[2]!.replace(/,\s*$/, "").trim(),
      ),
      startTime: spacedMatch[3]!,
      endTime: spacedMatch[4]!,
    });
  }

  return rows;
}

function splitKnownClubColumns(value: string, expectedCount: number): string[] {
  const endings = ["악반", "신명화랑", "산틀", "들녘", "탈반"] as const;
  const clubs: string[] = [];
  let cursor = 0;

  while (cursor < value.length && clubs.length < expectedCount) {
    const next = endings
      .map((ending) => {
        const index = value.indexOf(ending, cursor);
        return index === -1
          ? null
          : { ending, endIndex: index + ending.length };
      })
      .filter((item) => item !== null)
      .sort((a, b) => a.endIndex - b.endIndex)[0];

    if (!next) break;

    const club = normalizeClubNameFromOcr(value.slice(cursor, next.endIndex));
    if (club) clubs.push(club);
    cursor = next.endIndex;
  }

  return clubs.length === expectedCount ? clubs : [];
}

export function extractColumnScheduleRowsFromDetectedText(
  detectedText: string,
): ScheduleRow[] {
  const lines = detectedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const dayLine = lines.find((line) => /^요일/.test(line));
  const clubLine = lines.find(
    (line) =>
      /^시간/.test(line) &&
      !/\d{1,2}:\d{2}\s*[~～-]\s*\d{1,2}:\d{2}/.test(line),
  );

  if (!dayLine || !clubLine) return [];

  const timeRanges = Array.from(
    detectedText.matchAll(/(\d{1,2}:\d{2})\s*[~～-]\s*(\d{1,2}:\d{2})/g),
  )
    .map((match) => ({ startTime: match[1]!, endTime: match[2]! }))
    .filter((time) => !(time.startTime === "08:00" && time.endTime === "23:00"));

  if (timeRanges.length === 0) return [];

  const days = Array.from(dayLine.matchAll(/[월화수목금]/g)).map(
    (match) => match[0],
  );
  const count = Math.min(days.length, timeRanges.length);
  if (count === 0) return [];

  const clubSource = clubLine
    .replace(/^시간\s*/, "")
    .replace(/홍풍\s*어플.*$/, "")
    .trim();
  const clubs = splitKnownClubColumns(clubSource, count);
  if (clubs.length !== count) return [];

  return Array.from({ length: count }, (_, index) => ({
    day: days[index]!,
    clubName: clubs[index]!,
    startTime: timeRanges[index]!.startTime,
    endTime: timeRanges[index]!.endTime,
  }));
}

export function collectScheduleRowsFromDetectedText(
  detectedText: string,
): ScheduleRow[] {
  const rowSchedule = extractScheduleRowsFromDetectedText(detectedText);
  return rowSchedule.length > 0
    ? rowSchedule
    : extractColumnScheduleRowsFromDetectedText(detectedText);
}
