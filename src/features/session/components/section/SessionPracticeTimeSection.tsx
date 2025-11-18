"use client";

import { palette } from "../../constants/session-ui.constants";
import type { Session } from "../../types";

export function SessionPracticeTimeSection({ session }: { session: Session }) {
  return (
    <div>
      <h3 className="px-1 text-lg font-bold" style={{ color: palette.grey700 }}>
        연습 시간
      </h3>
      <div className="h-5" />
      <div className="mx-4 flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span style={{ color: palette.grey400 }}>시작 시간</span>
          <span style={{ color: palette.grey700 }}>{session.startTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: palette.grey400 }}>종료 시간</span>
          <span style={{ color: palette.grey700 }}>{session.endTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: palette.grey400 }}>연장 횟수</span>
          <span style={{ color: palette.grey700 }}>
            {session.extendCount}회
          </span>
        </div>
      </div>
    </div>
  );
}
