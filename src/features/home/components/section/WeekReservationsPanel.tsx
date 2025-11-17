import { WeekReservationGrid } from "@admin/features/reservation";
import { PanelCard } from "../ui";

export function WeekReservationsPanel() {
  return (
    <PanelCard
      title="이번 주 예약"
      href="/reservation/live/weeks"
      hrefLabel="연습실 예약 관리"
      className="col-span-3 min-h-[420px]"
    >
      <div className="h-full max-h-[max(640px,75vh)] overflow-auto p-2">
        <WeekReservationGrid
          columnWidthPx={96}
          halfHourHeightPx={24}
          timeRulerHeightPx={44}
        />
      </div>
    </PanelCard>
  );
}
