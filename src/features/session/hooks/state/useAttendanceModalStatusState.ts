import { useEffect, useState } from "react";
import type { SessionAttendanceEntry, SessionAttendanceStatusLabel } from "../../types";

export function useAttendanceModalStatusState({
  open,
  availableChips,
  byStatus,
}: {
  open: boolean;
  availableChips: SessionAttendanceStatusLabel[];
  byStatus: Record<string, SessionAttendanceEntry[]>;
}) {
  const [selectedStatus, setSelectedStatus] =
    useState<SessionAttendanceStatusLabel | null>(null);

  useEffect(() => {
    if (open && availableChips.length > 0 && selectedStatus == null) {
      setSelectedStatus(availableChips[0]);
    }
  }, [open, availableChips, selectedStatus]);

  useEffect(() => {
    if (
      availableChips.length > 0 &&
      selectedStatus &&
      !byStatus[selectedStatus]?.length
    ) {
      setSelectedStatus(availableChips[0]);
    }
  }, [availableChips, byStatus, selectedStatus]);

  useEffect(() => {
    if (!open) setSelectedStatus(null);
  }, [open]);

  return { selectedStatus, setSelectedStatus };
}
