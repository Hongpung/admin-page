import dayjs from "dayjs";

export function getMonday(date: Date): Date {
  const d = dayjs(date).toDate();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getSunday(date: Date): Date {
  const d = dayjs(date).toDate();
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** `YYYY-MM-DD` → 해당 일 자정(로컬) */
export function parseLocalDateFromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0);
}

export function getWeekDates(date: Date): string[] {
  const selectedDate = dayjs(date).toDate();
  const day = selectedDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  selectedDate.setDate(selectedDate.getDate() + diff);
  const weekDates: string[] = [];

  for (let i = 0; i < 7; i++) {
    const current = dayjs(selectedDate).toDate();
    current.setDate(selectedDate.getDate() + i);
    const month = String(current.getMonth() + 1);
    const dayNum = String(current.getDate());
    weekDates.push(`${month}/${dayNum}`);
  }

  return weekDates;
}
