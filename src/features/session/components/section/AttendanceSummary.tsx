"use client";

import { palette } from "../../constants/session-ui.constants";
import type { SessionAttendanceEntry } from "../../types";

function AttendanceSummaryItem({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex h-14 w-16 flex-col items-center justify-between">
      <span className="text-sm" style={{ color: palette.grey700 }}>
        {label}
      </span>
      <span className="text-2xl font-bold" style={{ color }}>
        {count > 0 ? count : "—"}
      </span>
    </div>
  );
}

export function AttendanceSummary({
  byStatus,
  sessionType,
  onViewAll,
}: {
  byStatus: Record<string, SessionAttendanceEntry[]>;
  sessionType: string;
  onViewAll: () => void;
}) {
  const getCount = (status: string) => byStatus[status]?.length ?? 0;
  const isReserved = sessionType === "RESERVED";

  return (
    <button
      type="button"
      onClick={onViewAll}
      className="w-full rounded-none text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-end justify-between px-1">
        <h3 className="text-lg font-bold" style={{ color: palette.grey700 }}>
          {isReserved ? "출석 확인" : "참가 확인"}
        </h3>
      </div>
      <div className="h-5" />
      <div
        className="mx-2 flex flex-row items-center justify-evenly rounded-2xl py-5"
        style={{ backgroundColor: palette.grey100 }}
      >
        {isReserved ? (
          <>
            <AttendanceSummaryItem
              label="출석"
              count={getCount("출석")}
              color={palette.blue500}
            />
            <AttendanceSummaryItem
              label="지각"
              count={getCount("지각")}
              color={palette.red500}
            />
            <AttendanceSummaryItem
              label="결석"
              count={getCount("결석")}
              color={palette.grey400}
            />
          </>
        ) : (
          <AttendanceSummaryItem
            label="참가"
            count={getCount("참가")}
            color={palette.green500}
          />
        )}
      </div>
    </button>
  );
}
