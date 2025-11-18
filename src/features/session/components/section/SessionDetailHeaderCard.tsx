"use client";

import { palette } from "../../constants/session-ui.constants";
import { weekdayFromSessionDate } from "../../lib";
import type { Session } from "../../types";
import { BookmarkRegularIcon } from "../ui/BookmarkRegularIcon";

export function SessionDetailHeaderCard({ session }: { session: Session }) {
  const weekday = weekdayFromSessionDate(session.date);

  return (
    <div
      className="relative mx-1 min-h-[5rem] rounded-[10px] border"
      style={{ borderColor: palette.grey200 }}
    >
      <div className="p-4 pr-4 pt-4">
        <p
          className="pr-12 text-lg font-bold"
          style={{ color: palette.grey700 }}
        >
          {session.title}
        </p>
        <p
          className="mt-2 text-sm font-normal"
          style={{ color: palette.grey500 }}
        >
          {session.date}
          {weekday ? ` (${weekday})` : ""}
        </p>
        {session.reservationType === "REGULAR" ? (
          <div className="absolute right-2 top-1">
            <BookmarkRegularIcon />
          </div>
        ) : (
          <div className="absolute right-4 top-3 text-right">
            <p
              className="text-sm font-normal"
              style={{ color: palette.grey500 }}
            >
              {session.creatorName}
            </p>
            {session.creatorNickname ? (
              <p className="mt-1 text-xs" style={{ color: palette.grey500 }}>
                {session.creatorNickname}
              </p>
            ) : null}
          </div>
        )}
        {session.forceEnd ? (
          <span className="absolute bottom-3 right-4 inline-flex items-center justify-center rounded-md bg-red-100 px-2 py-1 text-center text-xs font-semibold text-red-700">
            강제 종료
          </span>
        ) : null}
      </div>
    </div>
  );
}
