"use client";

import { useMemo } from "react";
import { bucketByStatus } from "../../lib";
import { useSessionAttendanceModalOpenState } from "../../hooks/state";
import type { Session } from "../../types";
import { AttendanceModal } from "../overlay/AttendanceModal";
import { AttendanceSummary } from "./AttendanceSummary";
import { SessionBorrowInstrumentsSection } from "./SessionBorrowInstrumentsSection";
import { SessionDetailHeaderCard } from "./SessionDetailHeaderCard";
import { SessionPracticeTimeSection } from "./SessionPracticeTimeSection";
import { SessionReturnImagesSection } from "./SessionReturnImagesSection";

export function SessionDetailPanel({ session }: { session: Session }) {
  const {
    isAttendanceOpen,
    closeAttendanceModal,
    openAttendanceModal,
  } = useSessionAttendanceModalOpenState();

  const byStatus = useMemo(
    () => bucketByStatus(session.attendanceList),
    [session.attendanceList],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 px-3 pb-1 pt-1">
      <h2 className="shrink-0 px-1 text-base font-semibold">상세 내역</h2>

      <SessionDetailHeaderCard session={session} />
      <SessionPracticeTimeSection session={session} />

      <AttendanceSummary
        byStatus={byStatus}
        sessionType={session.sessionType}
        onViewAll={openAttendanceModal}
      />

      <AttendanceModal
        sessionType={session.sessionType}
        byStatus={byStatus}
        open={isAttendanceOpen}
        onClose={closeAttendanceModal}
      />

      <SessionBorrowInstrumentsSection session={session} />
      <SessionReturnImagesSection session={session} />
    </div>
  );
}
