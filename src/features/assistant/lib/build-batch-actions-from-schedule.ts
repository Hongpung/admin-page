import {
  collectScheduleRowsFromDetectedText,
  extractScheduleDurationFromText,
  type ScheduleRow,
} from "@admin/features/assistant/lib/assistant-schedule-extract";
import { normalizeReservationBatchClubKey } from "@admin/features/assistant/lib/expand-assistant-actions";
import type { AssistantAction } from "@admin/features/assistant/types/assistant-analysis.types";
import type { ClubLeaderInfo } from "@admin/features/assistant/types/club-leader.types";

const DAY_ORDER = ["월", "화", "수", "목", "금", "토", "일"] as const;

function formatClubRegularPracticeTitle(clubName: string): string {
  return `${clubName.trim()}의 정기 연습`;
}

function normalizeClubName(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function findClubLeader(
  leaders: ClubLeaderInfo[],
  clubName: string,
): ClubLeaderInfo | null {
  const normalized = normalizeClubName(clubName);
  if (!normalized) return null;

  return (
    leaders.find((leader) => normalizeClubName(leader.clubName) === normalized) ??
    leaders.find((leader) =>
      normalizeClubName(leader.clubName).includes(normalized),
    ) ??
    leaders.find((leader) =>
      normalized.includes(normalizeClubName(leader.clubName)),
    ) ??
    null
  );
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

function groupScheduleRowsByClub(rows: ScheduleRow[]) {
  const groups = new Map<
    string,
    {
      clubName: string;
      dayTimes: Array<{ day: string; startTime: string; endTime: string }>;
    }
  >();

  for (const row of rows) {
    const key = normalizeReservationBatchClubKey(row.clubName);
    const dayTime = {
      day: row.day,
      startTime: row.startTime,
      endTime: row.endTime,
    };
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        clubName: row.clubName,
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

export function buildBatchActionsFromScheduleText(
  message: string,
  detectedText: string,
  leaders: ClubLeaderInfo[] = [],
  options?: { groupByClub?: boolean },
): AssistantAction[] {
  const duration = extractScheduleDurationFromText(`${message}\n${detectedText}`);
  if (!duration) return [];

  const rows = collectScheduleRowsFromDetectedText(detectedText);
  if (rows.length === 0) return [];

  if (options?.groupByClub === false) {
    return rows.map((row) => {
      const leader = leaders.length > 0 ? findClubLeader(leaders, row.clubName) : null;
      const resolvedClubName = leader?.clubName ?? row.clubName;
      const batchReservationOption: Record<string, unknown> = {
        title: formatClubRegularPracticeTitle(resolvedClubName),
        reservationType: "REGULAR",
        clubName: resolvedClubName,
      };

      if (leader) {
        batchReservationOption.creatorId = leader.leaderMemberId;
      }

      return {
        type: "RESERVATION_BATCH_CREATE",
        payload: {
          dayTimes: [
            {
              day: row.day,
              startTime: row.startTime,
              endTime: row.endTime,
            },
          ],
          duration,
          batchReservationOption,
        },
      };
    });
  }

  return groupScheduleRowsByClub(rows).map(({ clubName, dayTimes }) => {
    const leader = leaders.length > 0 ? findClubLeader(leaders, clubName) : null;
    const resolvedClubName = leader?.clubName ?? clubName;
    const batchReservationOption: Record<string, unknown> = {
      title: formatClubRegularPracticeTitle(resolvedClubName),
      reservationType: "REGULAR",
      clubName: resolvedClubName,
    };

    if (leader) {
      batchReservationOption.creatorId = leader.leaderMemberId;
    }

    return {
      type: "RESERVATION_BATCH_CREATE",
      payload: {
        dayTimes,
        duration,
        batchReservationOption,
      },
    };
  });
}
