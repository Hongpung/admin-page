"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useStore } from "zustand/react";
import { useOptionalReservationWeekUiStore } from "../../provider/ReservationWeekUiContext";
import { useReservationDetailNavigation } from "../../hooks/action";
import { useWeeklyReservationsGrid } from "../../hooks/view-model";
import { useDateStore } from "../../store/date-store";
import { getMonday, getSunday } from "../../lib/week-date-utils";
import type { ReservationWeekUiStore } from "../../store/reservation-week-ui-store";
import type { WeekReservationGridCellMetrics } from "../../lib/week-grid-metrics";
import { WeekReservationGridTable } from "../ui/WeekReservationGridTable";

dayjs.extend(utc);
dayjs.extend(timezone);

function getTodayWeekRangeInSeoul() {
  const today = dayjs().tz("Asia/Seoul").toDate();
  return {
    selectedDate: today,
    startOfWeek: dayjs(getMonday(today)).tz("Asia/Seoul").format("YYYY-MM-DD"),
    endOfWeek: dayjs(getSunday(today)).tz("Asia/Seoul").format("YYYY-MM-DD"),
  };
}

type Props = {
  cellMetrics: WeekReservationGridCellMetrics;
  store?: ReservationWeekUiStore;
};

function WeekReservationGridWithStore({
  store,
  cellMetrics,
}: {
  store: ReservationWeekUiStore;
  cellMetrics: WeekReservationGridCellMetrics;
}) {
  const { selectedDate, startOfWeek, endOfWeek } = useDateStore();
  const modal = useStore(store, (s) => s.modal);
  const { openReservationDetail } = useReservationDetailNavigation();
  const { weekDates, weeklyReservations } = useWeeklyReservationsGrid(
    startOfWeek,
    endOfWeek,
    modal,
  );

  return (
    <WeekReservationGridTable
      weekDates={weekDates}
      weeklyReservations={weeklyReservations}
      selectedDate={selectedDate}
      onReservationClick={openReservationDetail}
      cellMetrics={cellMetrics}
    />
  );
}

function WeekReservationGridStandalone({
  cellMetrics,
}: {
  cellMetrics: WeekReservationGridCellMetrics;
}) {
  const { selectedDate, startOfWeek, endOfWeek } = getTodayWeekRangeInSeoul();
  const { openReservationDetail } = useReservationDetailNavigation({
    fallbackPath: "/reservation/live/weeks",
  });
  const { weekDates, weeklyReservations } = useWeeklyReservationsGrid(
    startOfWeek,
    endOfWeek,
    "None",
  );

  return (
    <WeekReservationGridTable
      weekDates={weekDates}
      weeklyReservations={weeklyReservations}
      selectedDate={selectedDate}
      onReservationClick={openReservationDetail}
      cellMetrics={cellMetrics}
    />
  );
}

export function WeekReservationGridContent({ cellMetrics }: Props) {
  const store = useOptionalReservationWeekUiStore();
  if (store)
    return (
      <WeekReservationGridWithStore store={store} cellMetrics={cellMetrics} />
    );
  return <WeekReservationGridStandalone cellMetrics={cellMetrics} />;
}
