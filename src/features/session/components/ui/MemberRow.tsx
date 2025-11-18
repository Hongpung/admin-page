"use client";

import { palette } from "../../constants/session-ui.constants";
import type { SessionAttendanceEntry } from "../../types";

export function MemberRow({
  member,
}: {
  member: SessionAttendanceEntry["member"];
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-white px-3 py-2.5 shadow-sm">
      <span className="text-sm font-medium" style={{ color: palette.grey700 }}>
        {member.name}
      </span>
      {member.nickname ? (
        <span className="text-xs" style={{ color: palette.grey400 }}>
          {member.nickname}
        </span>
      ) : null}
    </div>
  );
}
