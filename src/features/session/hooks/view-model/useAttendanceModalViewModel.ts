import { useMemo } from "react";
import {
  buildSectionContent,
  statusChipOrder,
  type SectionContent,
} from "../../lib";
import type {
  SessionAttendanceEntry,
  SessionAttendanceStatusLabel,
} from "../../types";

export function useAttendanceModalViewModel({
  byStatus,
  sessionType,
}: {
  byStatus: Record<string, SessionAttendanceEntry[]>;
  sessionType: string;
}) {
  const order = useMemo(() => statusChipOrder(sessionType), [sessionType]);

  const { availableChips, sectionContentByStatus } = useMemo(() => {
    const chips = order.filter((status) => (byStatus[status]?.length ?? 0) > 0);
    const contentByStatus: Partial<Record<string, SectionContent>> = {};

    for (const status of order) {
      const items = byStatus[status] ?? [];
      if (items.length === 0) continue;
      contentByStatus[status] = buildSectionContent(status, items);
    }

    return {
      availableChips: chips,
      sectionContentByStatus: contentByStatus,
    };
  }, [byStatus, order]);

  return {
    availableChips,
    sectionContentByStatus,
  } as {
    availableChips: SessionAttendanceStatusLabel[];
    sectionContentByStatus: Partial<Record<string, SectionContent>>;
  };
}
