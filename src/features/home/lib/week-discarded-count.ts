import {
  getMonday,
  getSunday,
  type DiscardedReservationItem,
} from "@admin/features/reservation";

export function countDiscardedInCurrentWeek(items: DiscardedReservationItem[]): number {
  const now = new Date();
  const start = getMonday(now);
  start.setHours(0, 0, 0, 0);
  const end = getSunday(now);
  end.setHours(23, 59, 59, 999);

  return items.filter((row) => {
    const t = new Date(row.createdAt);
    return !Number.isNaN(t.getTime()) && t >= start && t <= end;
  }).length;
}
