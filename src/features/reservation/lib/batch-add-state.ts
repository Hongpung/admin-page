import { weekdays_ko, type TimeFormat, type WeekDay } from "../constants/constants";
import type {
  BatchAddDayTimeRow,
  BatchAddOptionState,
} from "./batch-add-flow";

export type BatchAddDurationState = {
  startDate?: Date;
  endDate?: Date;
};

export type BatchAddDirtyInput = {
  practiceTitle: string;
  dayTimes: BatchAddDayTimeRow[];
  duration: BatchAddDurationState;
  option: BatchAddOptionState;
  creatorName: string;
};

export function isBatchAddDirty({
  practiceTitle,
  dayTimes,
  duration,
  option,
  creatorName,
}: BatchAddDirtyInput): boolean {
  if (practiceTitle.trim().length > 0) return true;
  if (dayTimes.length > 0) return true;
  if (duration.startDate != null || duration.endDate != null) return true;
  if ((option.creatorName ?? "").trim().length > 0) return true;
  if (option.creatorId != null && option.creatorId > 0) return true;
  if (option.reservationType !== "EXTERNAL") return true;
  if ((option.title ?? "").trim().length > 0) return true;
  if (creatorName.trim().length > 0) return true;
  return false;
}

export function sortBatchAddDayTimes(
  dayTimes: BatchAddDayTimeRow[],
): BatchAddDayTimeRow[] {
  return [...dayTimes].sort((a, b) => {
    const idxA = weekdays_ko.indexOf(a.day);
    const idxB = weekdays_ko.indexOf(b.day);
    return idxA - idxB;
  });
}

export function appendBatchAddDayTime(
  dayTimes: BatchAddDayTimeRow[],
  day: WeekDay,
): BatchAddDayTimeRow[] {
  return sortBatchAddDayTimes([...dayTimes, { day }]);
}

export function removeBatchAddDayTime(
  dayTimes: BatchAddDayTimeRow[],
  index: number,
): BatchAddDayTimeRow[] {
  return dayTimes.filter((_, i) => i !== index);
}

export function updateBatchAddDayTime(
  dayTimes: BatchAddDayTimeRow[],
  index: number,
  field: "startTime" | "endTime",
  value: TimeFormat,
): BatchAddDayTimeRow[] {
  return dayTimes.map((item, i) =>
    i === index ? { ...item, [field]: value } : item,
  );
}
