"use client";

import { palette } from "../../constants/session-ui.constants";
import type { Session } from "../../types";

export function SessionBorrowInstrumentsSection({
  session,
}: {
  session: Session;
}) {
  return (
    <div>
      <h3 className="px-1 text-lg font-bold" style={{ color: palette.grey700 }}>
        대여 악기
      </h3>
      <div className="h-3" />
      {session.borrowInstruments.length > 0 ? (
        <ul className="mx-4 list-inside space-y-1 text-sm text-gray-700">
          {session.borrowInstruments.map((instrument, idx) => (
            <li key={`${instrument.name}-${idx}`}>{instrument.name}</li>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-center text-gray-300">
          대여한 악기가 없습니다.
        </p>
      )}
    </div>
  );
}
