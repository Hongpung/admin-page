import {
  addDays,
  getKstDateParts,
  toYmd,
  type YmdDateParts,
} from "@admin/features/assistant/lib/assistant-date-range";
import { mergeAdjacentDatedScheduleSlots } from "@admin/features/assistant/lib/merge-adjacent-schedule-slots";
import { inferScheduleSlotKind } from "@admin/features/assistant/lib/assistant-schedule-canonical-format";
import type { TimeFormat } from "@admin/features/reservation/constants/constants";

function finalizeDatedScheduleSlots(slots: DatedScheduleSlot[]): DatedScheduleSlot[] {
  return mergeAdjacentDatedScheduleSlots(slots);
}

export type DatedScheduleSlot = {
  date: string;
  startTime: TimeFormat;
  endTime: TimeFormat;
  title: string;
  creatorName: string;
  kindHint?: string | null;
};

const SKIP_TITLE_PATTERN = /자율\s*연습|홍풍\s*어플/;
const DATED_SECTION_PATTERN = /\d{1,2}\/\d{1,2}\s*\([월화수목금토일]\)/;
const SLOT_PATTERN =
  /(\d{1,2}:\d{2})\s*[-~～]\s*(\d{1,2}:\d{2})\s+([^,;.]+?)\s*\(([^)]+)\)/g;
const STRUCTURED_SLOT_PATTERN =
  /(\d{1,2}:\d{2})\s*[-~～]\s*(\d{1,2}:\d{2})\s+[^,;.]+?\s*\([^)]+\)|\d{4}-\d{2}-\d{2}\s*,\s*\d{1,2}:\d{2}\s*[-~～]\s*\d{1,2}:\d{2}\s*,/;
const CANONICAL_COMMA_SLOT_LINE_PATTERN =
  /^(\d{4}-\d{2}-\d{2})\s*,\s*(\d{1,2}:\d{2})\s*[-~～]\s*(\d{1,2}:\d{2})\s*,\s*([^,;]+?)\s*,\s*([^,;\n]+?)(?:\s*;\s*(.+))?$/i;
const CANONICAL_LEGACY_SLOT_LINE_PATTERN =
  /^(\d{4}-\d{2}-\d{2})[-\s]+(\d{1,2}:\d{2})[-~～](\d{1,2}:\d{2})\s+([^,;]+?)\s*,\s*([^,;\n]+?)(?:\s*;\s*(.+))?$/;
const PERIOD_TIME_PATTERN =
  /(\d)\s*교시\s*\(\s*(\d{1,2}:\d{2})\s*[-~～]\s*(\d{1,2}:\d{2})\s*\)/g;
const EMPTY_CELL_PATTERN = /^[-—·\s]*$|^(?:없음|공강|x)$/i;

function snapClock(value: string): TimeFormat | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match?.[1] || !match[2]) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]) >= 30 ? 30 : 0;
  const candidate = `${String(hour).padStart(2, "0")}:${
    minute === 30 ? "30" : "00"
  }`;
  return candidate as TimeFormat;
}

function timeToMinutes(time: TimeFormat): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour! * 60 + minute!;
}

function minutesToTime(minutes: number): TimeFormat {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${
    minute === 30 ? "30" : "00"
  }` as TimeFormat;
}

function splitIntoTwoHourSlots(
  startTime: TimeFormat,
  endTime: TimeFormat
): Array<{ startTime: TimeFormat; endTime: TimeFormat }> {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const slots: Array<{ startTime: TimeFormat; endTime: TimeFormat }> = [];

  for (let cursor = startMin; cursor + 120 <= endMin; cursor += 120) {
    slots.push({
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(cursor + 120),
    });
  }

  return slots;
}

function resolveScheduleYear(message: string, detectedText: string): number {
  const combined = `${message}\n${detectedText}`;
  const yearMatch = combined.match(/(20\d{2})\s*년?/);
  if (yearMatch?.[1]) return Number(yearMatch[1]);
  return getKstDateParts().year;
}

function extractCreatorName(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const first = trimmed.split(/[,，]/)[0]?.trim();
  return first || null;
}

export function isDatedPracticeScheduleText(text: string): boolean {
  return (
    DATED_SECTION_PATTERN.test(text) ||
    hasStructuredScheduleSlots(text) ||
    isGridScheduleLayoutText(text)
  );
}

/** 날짜 열 + 교시 행 구조 (행사명·제목 키워드 불필요) */
export function isGridScheduleLayoutText(text: string): boolean {
  const hasPeriodRows = /\d\s*교시\s*\(\s*\d{1,2}:\d{2}/.test(text);
  const hasDateColumns =
    DATED_SECTION_PATTERN.test(text) ||
    /\d{1,2}\/\d{1,2}\s*\([월화수목금토일]\)/.test(text);

  return hasPeriodRows && hasDateColumns;
}

export function hasStructuredScheduleSlots(detectedText: string): boolean {
  return STRUCTURED_SLOT_PATTERN.test(detectedText);
}

/** 연습 목록·교시 정의만 있고 날짜별 슬롯이 없는 요약 OCR */
export function isCollapsedScheduleSummary(detectedText: string): boolean {
  if (hasStructuredScheduleSlots(detectedText)) return false;

  const hasPeriodDefs = /각\s*교시|교시별\s*시간|\d\s*교시\s*\(/.test(
    detectedText,
  );
  const hasDateSpan =
    /(\d{1,2})\/(\d{1,2})\s*\([월화수목금토일]\)\s*[~～-]/.test(detectedText) ||
    /(\d{1,2})\/(\d{1,2})\s*\([월화수목금토일]\)/.test(detectedText);

  return hasPeriodDefs && hasDateSpan;
}

function expandDateRange(start: YmdDateParts, end: YmdDateParts): string[] {
  const dates: string[] = [];
  let cursor = start;
  const endYmd = toYmd(end);

  while (dates.length < 31) {
    const current = toYmd(cursor);
    dates.push(current);
    if (current === endYmd) break;
    cursor = addDays(cursor, 1);
  }

  return dates;
}

function extractDateColumnsFromText(
  message: string,
  detectedText: string,
): string[] {
  const year = resolveScheduleYear(message, detectedText);

  const rangeMatch = detectedText.match(
    /(\d{1,2})\/(\d{1,2})\s*\([월화수목금토일]\)\s*[~～-]\s*(\d{1,2})\/(\d{1,2})\s*\([월화수목금토일]\)/,
  );
  if (rangeMatch?.[1] && rangeMatch[2] && rangeMatch[3] && rangeMatch[4]) {
    return expandDateRange(
      { year, month: Number(rangeMatch[1]), day: Number(rangeMatch[2]) },
      { year, month: Number(rangeMatch[3]), day: Number(rangeMatch[4]) },
    );
  }

  const dates: string[] = [];
  for (const match of Array.from(
    detectedText.matchAll(/(\d{1,2})\/(\d{1,2})\s*\([월화수목금토일]\)/g),
  )) {
    const date = toYmd({
      year,
      month: Number(match[1]),
      day: Number(match[2]),
    });
    if (!dates.includes(date)) {
      dates.push(date);
    }
  }

  return dates;
}

function extractPeriodTimeMap(
  detectedText: string,
): Map<number, { startTime: TimeFormat; endTime: TimeFormat }> {
  const map = new Map<number, { startTime: TimeFormat; endTime: TimeFormat }>();

  for (const match of Array.from(detectedText.matchAll(PERIOD_TIME_PATTERN))) {
    const period = Number(match[1]);
    const startTime = snapClock(match[2] ?? "");
    const endTime = snapClock(match[3] ?? "");
    if (!startTime || !endTime) continue;
    map.set(period, { startTime, endTime });
  }

  return map;
}

function parsePracticeCell(
  cell: string,
): { title: string; creatorName: string } | null {
  const trimmed = cell.trim();
  if (!trimmed || EMPTY_CELL_PATTERN.test(trimmed)) return null;

  const match = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!match?.[1] || !match[2]) return null;

  const title = match[1].trim();
  const creatorName = extractCreatorName(match[2]);
  if (!title || !creatorName || SKIP_TITLE_PATTERN.test(title)) return null;

  return { title, creatorName };
}

function appendMatrixRowSlots(
  slots: DatedScheduleSlot[],
  dates: string[],
  startTime: TimeFormat,
  endTime: TimeFormat,
  cells: string[],
): void {
  for (let index = 0; index < Math.min(cells.length, dates.length); index += 1) {
    const parsed = parsePracticeCell(cells[index] ?? "");
    if (!parsed) continue;

    for (const chunk of splitIntoTwoHourSlots(startTime, endTime)) {
      pushSlot(slots, {
        date: dates[index]!,
        startTime: chunk.startTime,
        endTime: chunk.endTime,
        title: parsed.title,
        creatorName: parsed.creatorName,
      });
    }
  }
}

function extractMatrixScheduleSlots(
  message: string,
  detectedText: string,
): DatedScheduleSlot[] {
  const dates = extractDateColumnsFromText(message, detectedText);
  if (dates.length < 2) return [];

  const periodTimes = extractPeriodTimeMap(detectedText);
  const slots: DatedScheduleSlot[] = [];
  const rowHeaderPattern = /(\d)\s*교시/;

  for (const rawLine of detectedText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!rowHeaderPattern.test(line)) continue;

    const parts = line.split(/[|｜]/).map((part) => part.trim());
    if (parts.length < 2) continue;

    const periodMatch = parts[0]?.match(
      /(\d)\s*교시(?:\s*\(\s*(\d{1,2}:\d{2})\s*[-~～]\s*(\d{1,2}:\d{2})\s*\))?/,
    );
    if (!periodMatch?.[1]) continue;

    const inlineStart = snapClock(periodMatch[2] ?? "");
    const inlineEnd = snapClock(periodMatch[3] ?? "");
    const mapped = periodTimes.get(Number(periodMatch[1]));
    const startTime = inlineStart ?? mapped?.startTime ?? null;
    const endTime = inlineEnd ?? mapped?.endTime ?? null;
    if (!startTime || !endTime) continue;

    appendMatrixRowSlots(slots, dates, startTime, endTime, parts.slice(1));
  }

  return slots;
}

function pushSlot(slots: DatedScheduleSlot[], slot: DatedScheduleSlot): void {
  const duplicate = slots.some(
    (existing) =>
      existing.date === slot.date &&
      existing.startTime === slot.startTime &&
      existing.title === slot.title
  );
  if (!duplicate) {
    slots.push(slot);
  }
}

function appendSlotsFromBody(
  slots: DatedScheduleSlot[],
  date: string,
  body: string
): void {
  const truncated = body.split(/그\s*외|자율\s*연습/)[0] ?? body;

  for (const match of Array.from(truncated.matchAll(SLOT_PATTERN))) {
    const startTime = snapClock(match[1] ?? "");
    const endTime = snapClock(match[2] ?? "");
    const title = match[3]?.trim() ?? "";
    const creatorName = extractCreatorName(match[4] ?? "");
    if (!startTime || !endTime || !title || !creatorName) continue;
    if (SKIP_TITLE_PATTERN.test(title)) continue;

    for (const chunk of splitIntoTwoHourSlots(startTime, endTime)) {
      pushSlot(slots, {
        date,
        startTime: chunk.startTime,
        endTime: chunk.endTime,
        title,
        creatorName,
      });
    }
  }
}

function extractInlineDatedScheduleSlots(
  message: string,
  detectedText: string
): DatedScheduleSlot[] {
  if (!DATED_SECTION_PATTERN.test(detectedText)) return [];

  const year = resolveScheduleYear(message, detectedText);
  const slots: DatedScheduleSlot[] = [];
  const sections = detectedText.split(
    /(?=\d{1,2}\/\d{1,2}\s*\([월화수목금토일]\))/
  );

  for (const section of sections) {
    const header = section.match(
      /^(\d{1,2})\/(\d{1,2})\s*\([월화수목금토일]\)\s*[:：]?\s*/
    );
    if (!header?.[1] || !header[2]) continue;

    const date = toYmd({
      year,
      month: Number(header[1]),
      day: Number(header[2]),
    });
    const body = section.slice(header[0].length);
    appendSlotsFromBody(slots, date, body);
  }

  return slots;
}

function parseCanonicalSlotLine(line: string): RegExpMatchArray | null {
  return (
    line.match(CANONICAL_COMMA_SLOT_LINE_PATTERN) ??
    line.match(CANONICAL_LEGACY_SLOT_LINE_PATTERN)
  );
}

function extractCanonicalScheduleSlots(detectedText: string): DatedScheduleSlot[] {
  const slots: DatedScheduleSlot[] = [];

  for (const rawLine of detectedText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = parseCanonicalSlotLine(line);
    if (!match?.[1] || !match[2] || !match[3] || !match[4] || !match[5]) {
      continue;
    }

    const startTime = snapClock(match[2]);
    const endTime = snapClock(match[3]);
    const title = match[4].trim();
    const kindHint = match[6]?.trim() || null;
    let creatorName = extractCreatorName(match[5]);
    if (!creatorName && /판굿\s*모임/i.test(title)) {
      creatorName = title;
    }
    if (
      !creatorName &&
      inferScheduleSlotKind(title, kindHint) === "external"
    ) {
      creatorName = title;
    }
    if (!startTime || !endTime || !title || !creatorName) continue;
    if (SKIP_TITLE_PATTERN.test(title)) continue;

    pushSlot(slots, {
      date: match[1],
      startTime,
      endTime,
      title,
      creatorName,
      kindHint,
    });
  }

  return slots;
}

function extractMultilineDatedScheduleSlots(
  message: string,
  detectedText: string
): DatedScheduleSlot[] {
  const year = resolveScheduleYear(message, detectedText);
  const slots: DatedScheduleSlot[] = [];
  let currentDate: string | null = null;

  for (const rawLine of detectedText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const dateMatch = line.match(
      /^(\d{1,2})\/(\d{1,2})\s*\([월화수목금토일]\)/
    );
    if (dateMatch?.[1] && dateMatch[2]) {
      currentDate = toYmd({
        year,
        month: Number(dateMatch[1]),
        day: Number(dateMatch[2]),
      });
      continue;
    }

    const rangeMatch = line.match(
      /^-\s*(\d{1,2}:\d{2})\s*[~～-]\s*(\d{1,2}:\d{2})\s*[:：]\s*(.+?)\s*\(([^)]+)\)\s*$/
    );
    if (
      !rangeMatch?.[1] ||
      !rangeMatch[2] ||
      !rangeMatch[3] ||
      !rangeMatch[4]
    ) {
      continue;
    }

    if (!currentDate) continue;

    const startTime = snapClock(rangeMatch[1]);
    const endTime = snapClock(rangeMatch[2]);
    const title = rangeMatch[3].trim();
    const creatorName = extractCreatorName(rangeMatch[4]);
    if (!startTime || !endTime || !title || !creatorName) continue;
    if (SKIP_TITLE_PATTERN.test(title)) continue;

    pushSlot(slots, {
      date: currentDate,
      startTime,
      endTime,
      title,
      creatorName,
    });
  }

  return slots;
}

export function extractDatedScheduleSlotsFromText(
  message: string,
  detectedText: string,
): DatedScheduleSlot[] {
  const canonicalSlots = extractCanonicalScheduleSlots(detectedText);
  if (canonicalSlots.length > 0) {
    return finalizeDatedScheduleSlots(canonicalSlots);
  }

  const inlineSlots = extractInlineDatedScheduleSlots(message, detectedText);
  if (inlineSlots.length > 0) {
    return finalizeDatedScheduleSlots(inlineSlots);
  }

  const multilineSlots = extractMultilineDatedScheduleSlots(message, detectedText);
  if (multilineSlots.length > 0) {
    return finalizeDatedScheduleSlots(multilineSlots);
  }

  return finalizeDatedScheduleSlots(
    extractMatrixScheduleSlots(message, detectedText),
  );
}
