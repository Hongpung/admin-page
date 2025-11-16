/** 월요일 시작: JS getDay()에서 일요일(0) => 앞쪽 빈칸 6칸 */
export function leadingBlankCount(jsWeekDay: number): number {
  if (jsWeekDay === 0) return 6;
  return jsWeekDay - 1;
}

export function buildDaysInMonth(year: number, month: number): number[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysArray: number[] = [];

  for (let i = 0; i < leadingBlankCount(firstDayOfMonth.getDay()); i++) {
    daysArray.push(0);
  }
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    daysArray.push(i);
  }
  while (daysArray.length % 7 !== 0) {
    daysArray.push(0);
  }
  return daysArray;
}

export function pickWeekDays(daysInMonth: number[], gridIndex: number): number[] {
  const startOfWeek = gridIndex - (gridIndex % 7);
  return daysInMonth.slice(startOfWeek, startOfWeek + 7).filter((d) => d !== 0);
}
