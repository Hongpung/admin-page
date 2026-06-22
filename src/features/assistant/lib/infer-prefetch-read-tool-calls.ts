import {
  addDays,
  getKstDateParts,
  toYmd,
} from "@admin/features/assistant/lib/assistant-date-range";
import { needsNoticeLookupForMessage } from "@admin/features/assistant/lib/assistant-notice-intent";
import { needsBannerLookupForMessage } from "@admin/features/assistant/lib/assistant-banner-intent";
import { needsReservationLookupForMessage } from "@admin/features/assistant/lib/assistant-reservation-intent";
import {
  needsMemberLookupForMessage,
  resolveMemberLookupUsername,
} from "@admin/features/assistant/lib/assistant-member-intent";
import { extractMemberNamesFromMultiReservationText } from "@admin/features/assistant/lib/parse-multi-reservations-from-text";
import { hasClubRegularReservationIntent } from "@admin/features/assistant/lib/extract-assistant-club-name";

export type InferredReadToolCall = {
  toolId: string;
  args: Record<string, unknown>;
};

type ExistingToolResult = {
  toolId: string;
  args: Record<string, unknown>;
};

function hasExistingResult(
  results: ExistingToolResult[],
  toolId: string,
  args: Record<string, unknown>
): boolean {
  return results.some(
    (entry) =>
      entry.toolId === toolId &&
      JSON.stringify(entry.args) === JSON.stringify(args)
  );
}

function resolveWeekOffset(message: string): number | null {
  const normalized = message.replace(/\s+/g, "");
  if (/(?:이번주|이번주간|금주|이번\s*주)/.test(normalized)) return 0;
  if (/(?:다음주|다음\s*주)/.test(normalized)) return 1;
  if (/(?:지난주|저번주|지난\s*주|저번\s*주)/.test(normalized)) return -1;
  return null;
}

function resolveRelativeDate(message: string): string | null {
  const normalized = message.replace(/\s+/g, "");
  const today = getKstDateParts();

  if (normalized.includes("모레")) {
    return toYmd(addDays(today, 2));
  }
  if (normalized.includes("내일")) {
    return toYmd(addDays(today, 1));
  }
  if (normalized.includes("오늘")) {
    return toYmd(today);
  }

  const isoMatch = message.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return null;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function buildMonthTerm(
  year: number,
  month: number
): { startDate: string; endDate: string } {
  return {
    startDate: `${year}-${pad2(month)}-01`,
    endDate: `${year}-${pad2(month)}-${pad2(lastDayOfMonth(year, month))}`,
  };
}

/** 메시지에 언급된 월을 기간 lookup용 term으로 변환. 여러 달이면 하나의 연속 기간으로 합침. */
export function resolveReservationLookupTermsFromMessage(
  message: string
): Array<{ startDate: string; endDate: string }> {
  const today = getKstDateParts();
  const normalized = message.replace(/\s+/g, "");
  const matches = Array.from(
    normalized.matchAll(/(?:(\d{4})년?)?(\d{1,2})월/g)
  );
  if (matches.length === 0) return [];

  const monthRanges: Array<{ year: number; month: number }> = [];

  for (const match of matches) {
    const month = Number(match[2]);
    if (!Number.isInteger(month) || month < 1 || month > 12) continue;

    let year = match[1] ? Number(match[1]) : today.year;
    if (!match[1] && month < today.month) {
      year += 1;
    }

    monthRanges.push({ year, month });
  }

  if (monthRanges.length === 0) return [];
  if (monthRanges.length === 1) {
    const only = monthRanges[0]!;
    return [buildMonthTerm(only.year, only.month)];
  }

  const sorted = [...monthRanges].sort((left, right) =>
    left.year !== right.year ? left.year - right.year : left.month - right.month
  );
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;

  return [
    {
      startDate: buildMonthTerm(first.year, first.month).startDate,
      endDate: buildMonthTerm(last.year, last.month).endDate,
    },
  ];
}

export function inferPrefetchReadToolCalls(
  message: string,
  existing: ExistingToolResult[] = []
): InferredReadToolCall[] {
  const calls: InferredReadToolCall[] = [];
  const shouldPrefetchClubLeaders =
    hasClubRegularReservationIntent(message) ||
    /(?:패짱|동아리.*정기|정기.*동아리|정기예약|정기\s*예약|clubName|batchReservationOption|RESERVATION_BATCH_CREATE)/.test(
      message,
    );

  if (
    shouldPrefetchClubLeaders &&
    !hasExistingResult(existing, "club_leaders_lookup", {})
  ) {
    calls.push({ toolId: "club_leaders_lookup", args: {} });
  }

  if (needsReservationLookupForMessage(message)) {
    const weekOffset = resolveWeekOffset(message);
    if (weekOffset !== null) {
      const args = { weekOffset };
      if (!hasExistingResult(existing, "reservations_by_week_lookup", args)) {
        calls.push({ toolId: "reservations_by_week_lookup", args });
      }
    } else {
      const terms = resolveReservationLookupTermsFromMessage(message);
      if (terms.length > 0) {
        for (const term of terms) {
          if (
            !hasExistingResult(existing, "reservations_by_term_lookup", term)
          ) {
            calls.push({ toolId: "reservations_by_term_lookup", args: term });
          }
        }
      } else {
        const date = resolveRelativeDate(message);
        if (
          date &&
          !hasExistingResult(existing, "reservations_by_date_lookup", { date })
        ) {
          calls.push({ toolId: "reservations_by_date_lookup", args: { date } });
        }
      }
    }
  }

  if (needsMemberLookupForMessage(message)) {
    const multiNames = extractMemberNamesFromMultiReservationText(message);
    if (multiNames.length > 0) {
      for (const username of multiNames) {
        const args: Record<string, unknown> = {
          page: 0,
          pageSize: 20,
          username,
        };
        if (!hasExistingResult(existing, "members_search_lookup", args)) {
          calls.push({ toolId: "members_search_lookup", args });
        }
      }
    } else if (!shouldPrefetchClubLeaders) {
      const username = resolveMemberLookupUsername(message);
      const args: Record<string, unknown> = { page: 0, pageSize: 20 };
      if (username) {
        args.username = username;
      }
      if (!hasExistingResult(existing, "members_search_lookup", args)) {
        calls.push({ toolId: "members_search_lookup", args });
      }
    }
  }

  if (needsBannerLookupForMessage(message)) {
    const args = {};
    if (!hasExistingResult(existing, "banners_list_lookup", args)) {
      calls.push({ toolId: "banners_list_lookup", args });
    }
  }

  if (needsNoticeLookupForMessage(message)) {
    const args = {};
    if (!hasExistingResult(existing, "notices_list_lookup", args)) {
      calls.push({ toolId: "notices_list_lookup", args });
    }
  }

  return calls;
}
