import { create } from "zustand";
import { getMonday, getSunday } from "../lib/week-date-utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

interface DateStore {
  selectedDate: Date;
  /** 해당 주 월요일 YYYY-MM-DD (기존 API·toISOString 기준) */
  startOfWeek: string;
  /** 해당 주 일요일 YYYY-MM-DD */
  endOfWeek: string;
  selectDate: (newDate: Date) => void;
}

function weekRangeStrings(
  d: Date,
): Pick<DateStore, "startOfWeek" | "endOfWeek"> {
  return {
    startOfWeek: dayjs(getMonday(d)).tz("Asia/Seoul").format("YYYY-MM-DD"),
    endOfWeek: dayjs(getSunday(d)).tz("Asia/Seoul").format("YYYY-MM-DD"),
  };
}

const initialDate = dayjs().tz("Asia/Seoul").toDate();

export const useDateStore = create<DateStore>()((set) => ({
  selectedDate: initialDate,
  ...weekRangeStrings(initialDate),
  selectDate: (newDate: Date) =>
    set((state) => {
      const nextRange = weekRangeStrings(newDate);
      if (
        nextRange.startOfWeek === state.startOfWeek &&
        nextRange.endOfWeek === state.endOfWeek
      ) {
        return { selectedDate: newDate };
      }
      return {
        selectedDate: newDate,
        ...nextRange,
      };
    }),
}));
