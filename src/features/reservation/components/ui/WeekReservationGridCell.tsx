import { getReservationCreatorDisplayLines } from "../../lib/format-reservation-creator-display";

type Props = {
  reservation: {
    reservationId: number;
    title: string;
    creatorName: string;
    creatorNickname?: string;
    startTime: string;
    endTime: string;
  };
  color: string;
  isStart: boolean;
  isEnd: boolean;
  halfHourHeightPx: number;
  onClick: () => void;
};

export function WeekReservationGridCell({
  reservation,
  color,
  isStart,
  isEnd,
  halfHourHeightPx,
  onClick,
}: Props) {
  const creatorLines = getReservationCreatorDisplayLines(
    reservation.creatorName,
    reservation.creatorNickname,
  );

  return (
    <div
      className={`box-border h-full w-full overflow-hidden px-2 py-1 flex flex-col bg-${color} cursor-pointer ${isEnd ? "border-b" : ""}`}
      style={{ height: halfHourHeightPx }}
      onClick={onClick}
    >
      {isStart && (
        <div className="flex flex-col justify-start font-semibold text-xs">
          {reservation.title}
        </div>
      )}
      {isEnd && (
        <div className="flex flex-col h-full items-end justify-end gap-1 text-xs font-semibold">
          {creatorLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
          <div>
            {reservation.startTime}~{reservation.endTime}
          </div>
        </div>
      )}
    </div>
  );
}
