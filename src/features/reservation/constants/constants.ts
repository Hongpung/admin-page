export const TimeArray = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
] as const;

export type TimeFormat = (typeof TimeArray)[number];

export const renderColor = [
  "[#93c5fd]",
  "[#ffaaaa]",
  "[#86efac]",
  "[#fef08a]",
  "[#bef264]",
  "[#d1d5db]",
  "[#c084fc]",
  "[#fecdd3]",
] as const;

// 컬러 코드 로드용
// bg-[#93c5fd] border-t-[#93c5fd] border-b-[#93c5fd]
// bg-[#ffaaaa] border-t-[#ffaaaa] border-b-[#ffaaaa]
// bg-[#86efac] border-t-[#86efac] border-b-[#86efac]
// bg-[#fef08a] border-t-[#fef08a] border-b-[#fef08a]
// bg-[#bef264] border-t-[#bef264] border-b-[#bef264]
// bg-[#d1d5db] border-t-[#d1d5db] border-b-[#d1d5db]
// bg-[#c084fc] border-t-[#c084fc] border-b-[#c084fc]
// bg-[#fecdd3] border-t-[#fecdd3] border-b-[#fecdd3]

export type ColorFormat = (typeof renderColor)[number];

export const weekdays_ko = ["월", "화", "수", "목", "금", "토", "일"] as const;

export type WeekDay = (typeof weekdays_ko)[number];

export const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"] as const;

export const hourlySlots = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
] as const;

export function addThirtyMinutes(time: TimeFormat): TimeFormat {
  const timeIndex = TimeArray.findIndex((t) => t === time);
  return TimeArray[timeIndex + 1] ?? "22:00";
}

// Reservation modal tailwind styles
export const reservationInputStyle =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25";

export const reservationPrimaryButtonStyle =
  "inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-sky-500/50";

export const reservationSecondaryButtonStyle =
  "inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-neutral-400/30";

export const reservationDangerButtonStyle =
  "inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-red-400/40";

export const reservationGhostButtonStyle =
  "inline-flex cursor-pointer items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:border-neutral-300 hover:bg-neutral-100";

export const reservationSelectStyle =
  "w-full rounded-md border border-neutral-200 bg-white px-2 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25";
