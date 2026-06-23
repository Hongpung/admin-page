import "server-only";

import type { DatedScheduleSlot } from "@admin/features/assistant/lib/extract-dated-schedule-slots";
import { extractDatedScheduleSlotsFromText } from "@admin/features/assistant/lib/extract-dated-schedule-slots";
import { fetchAssistantMemberSearch } from "@admin/features/assistant/lib/fetch-assistant-members";
import { resolveMemberLookup } from "@admin/features/assistant/lib/resolve-member-id-from-search";
import {
  resolveScheduleRequestPeriod,
  type ScheduleRequestPeriod,
} from "@admin/features/assistant/lib/resolve-schedule-request-period";
import type { AssistantAction } from "@admin/features/assistant/types/assistant-analysis.types";

const DAY_ORDER = ["월", "화", "수", "목", "금", "토", "일"] as const;
const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"] as const;

function weekdayFromYmd(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return WEEKDAY_NAMES[new Date(year!, month! - 1, day!).getDay()]!;
}

function sortDayTimes(
  dayTimes: Array<{ day: string; startTime: string; endTime: string }>,
): Array<{ day: string; startTime: string; endTime: string }> {
  return [...dayTimes].sort(
    (left, right) =>
      DAY_ORDER.indexOf(left.day as (typeof DAY_ORDER)[number]) -
      DAY_ORDER.indexOf(right.day as (typeof DAY_ORDER)[number]),
  );
}

function groupDatedSlotsForBatch(slots: DatedScheduleSlot[]) {
  const groups = new Map<
    string,
    {
      title: string;
      creatorName: string;
      dayTimes: Array<{ day: string; startTime: string; endTime: string }>;
    }
  >();

  for (const slot of slots) {
    const key = `${slot.title}|${slot.creatorName}`;
    const dayTime = {
      day: weekdayFromYmd(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
    };
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        title: slot.title,
        creatorName: slot.creatorName,
        dayTimes: [dayTime],
      });
      continue;
    }

    const duplicate = existing.dayTimes.some(
      (item) =>
        item.day === dayTime.day &&
        item.startTime === dayTime.startTime &&
        item.endTime === dayTime.endTime,
    );
    if (!duplicate) {
      existing.dayTimes.push(dayTime);
    }
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    dayTimes: sortDayTimes(group.dayTimes),
  }));
}

async function resolveCreatorIdsByName(
  token: string,
  names: string[],
): Promise<Map<string, ReturnType<typeof resolveMemberLookup>>> {
  const lookupByName = new Map<string, ReturnType<typeof resolveMemberLookup>>();

  await Promise.all(
    names.map(async (name) => {
      try {
        const result = await fetchAssistantMemberSearch(token, {
          username: name,
          page: 0,
          pageSize: 20,
        });
        lookupByName.set(name, resolveMemberLookup(name, result.members));
      } catch {
        lookupByName.set(name, { status: "not_found", query: name });
      }
    }),
  );

  return lookupByName;
}

export async function buildBatchActionsFromDatedScheduleMessage(
  token: string,
  message: string,
  detectedText: string,
  period?: ScheduleRequestPeriod | null,
): Promise<AssistantAction[]> {
  const slots = extractDatedScheduleSlotsFromText(message, detectedText);
  if (slots.length === 0) return [];

  const resolvedPeriod =
    period ?? resolveScheduleRequestPeriod(message, detectedText);
  if (!resolvedPeriod) return [];

  const groups = groupDatedSlotsForBatch(slots);
  const lookupByName = await resolveCreatorIdsByName(
    token,
    Array.from(new Set(groups.map((group) => group.creatorName))),
  );

  return groups.map(({ title, creatorName, dayTimes }) => {
    const lookup =
      lookupByName.get(creatorName) ?? ({ status: "not_found", query: creatorName } as const);
    const batchReservationOption: Record<string, unknown> = {
      title,
      reservationType: "REGULAR",
      clubName: title,
    };

    if (lookup.status === "matched") {
      batchReservationOption.creatorId = lookup.memberId;
    } else if (lookup.status === "not_found") {
      batchReservationOption.reservationType = "EXTERNAL";
      batchReservationOption.externalCreatorName = creatorName;
    } else {
      batchReservationOption.creatorName = creatorName;
    }

    return {
      type: "RESERVATION_BATCH_CREATE" as const,
      payload: {
        dayTimes,
        duration: {
          startDate: resolvedPeriod.startDate,
          endDate: resolvedPeriod.endDate,
        },
        batchReservationOption,
      },
    };
  });
}
