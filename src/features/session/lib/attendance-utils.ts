import type {
  SessionAttendanceEntry,
  SessionAttendanceStatusLabel,
} from "../types";

export type SectionContent =
  | {
      type: "byTime";
      groups: {
        timeKey: string;
        group: SessionAttendanceEntry[];
        timeLabel: string;
      }[];
    }
  | { type: "flat"; items: SessionAttendanceEntry[] };

export function bucketByStatus(
  list: SessionAttendanceEntry[] | undefined
): Record<string, SessionAttendanceEntry[]> {
  const out: Record<string, SessionAttendanceEntry[]> = {};
  if (!list?.length) return out;
  for (const e of list) {
    if (!out[e.status]) out[e.status] = [];
    out[e.status].push(e);
  }
  return out;
}

export function statusChipOrder(
  sessionType: string
): SessionAttendanceStatusLabel[] {
  return sessionType === "RESERVED"
    ? ["출석", "지각", "결석"]
    : ["참가", "지각", "결석"];
}

export function buildSectionContent(
  status: SessionAttendanceStatusLabel,
  items: SessionAttendanceEntry[]
): SectionContent {
  if (status === "결석") {
    return { type: "flat", items };
  }
  const byTime = items.reduce<Record<string, SessionAttendanceEntry[]>>(
    (acc, item) => {
      const key = item.timeStamp ?? "__null__";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {}
  );
  const timeKeys = Object.keys(byTime).sort((a, b) =>
    a === "__null__" ? 1 : b === "__null__" ? -1 : a.localeCompare(b)
  );
  return {
    type: "byTime",
    groups: timeKeys.map((timeKey) => ({
      timeKey,
      group: byTime[timeKey] ?? [],
      timeLabel: timeKey === "__null__" ? "시간 없음" : timeKey,
    })),
  };
}
