import type { FC } from "react";
import type { Session } from "../../types";

type SessionListPanelProps = {
  sessions: Session[];
  loading: boolean;
  selectedSessionId: number | null;
  onSelect: (session: Session | null) => void;
};

export function SessionListPanel({
  sessions,
  loading,
  selectedSessionId,
  onSelect,
}: SessionListPanelProps) {
  return (
    <div className="flex flex-col h-fit max-h-full w-full overflow-y-auto min-h-0 px-1">
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-12 text-gray-400">
          불러오는 중…
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-12 text-gray-400 text-center px-4">
          이 날짜에 등록된 연습실 이용 내역이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((session) => (
            <div key={session.sessionId}>
              <SessionCard
                session={session}
                isBefore={false}
                isSelected={selectedSessionId === session.sessionId}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type SessionCardProps = {
  session: Session;
  isBefore: boolean;
  isSelected: boolean;
  onSelect: (session: Session | null) => void;
};

const Color = {
  blue200: "#AECBFA",
  blue500: "#4285F4",
  green200: "#C3E6CB",
  green500: "#28A745",
  red200: "#F5C6CB",
  red500: "#DC3545",
  grey400: "#BDBDBD",
  grey700: "#424242",
};

const SessionCard: FC<SessionCardProps> = ({
  session,
  isBefore,
  isSelected,
  onSelect,
}) => {
  const [year, month, date] = session.date.split("-");

  const borderColor =
    session.reservationType === "REGULAR"
      ? isBefore
        ? Color.blue200
        : Color.blue500
      : session.participationAvailable
        ? isBefore
          ? Color.green200
          : Color.green500
        : isBefore
          ? Color.red200
          : Color.red500;

  const shellClass = isSelected
    ? "bg-blue-100 mx-2 h-30 rounded-xl border-2 border-blue-500 flex flex-col justify-between cursor-pointer"
    : `bg-white mx-2 h-30 rounded-xl border-2 border-[${borderColor}] flex flex-col justify-between cursor-pointer`;

  const titleClass = isSelected
    ? "flex flex-row gap-2 items-center font-bold text-lg text-blue-500"
    : `flex flex-row gap-2 items-center font-bold text-lg text-[${isBefore ? Color.grey400 : Color.grey700}]`;

  return (
    <div className={shellClass} onClick={() => onSelect(session)}>
      <div className="flex justify-between px-5 py-4 items-center">
        <div className={titleClass}>
          {session.title.length > 10
            ? session.title.slice(0, 7).trim() + "..."
            : session.title}
          {session.forceEnd && (
            <span className="p-1 text-gray-500 bg-gray-300 rounded-sm text-xs font-medium">
              강제 종료
            </span>
          )}
        </div>

        <div className="text-right">
          <p className="font-regular text-sm text-gray-600">
            {session.creatorName}
          </p>
          {session.creatorNickname && (
            <p className="font-regular text-xs text-gray-400">
              {session.creatorNickname}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between px-5 pb-3">
        <p className="font-light text-sm text-gray-400">
          {Number(year)}년 {Number(month)}월 {Number(date)}일
        </p>

        <p className="font-light text-sm text-gray-400">
          {session.startTime} ~ {session.endTime}
        </p>
      </div>
    </div>
  );
};
