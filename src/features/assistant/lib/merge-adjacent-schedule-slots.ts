import { inferScheduleSlotKind } from "@admin/features/assistant/lib/assistant-schedule-canonical-format";
import type { DatedScheduleSlot } from "@admin/features/assistant/lib/extract-dated-schedule-slots";

function compareSlots(a: DatedScheduleSlot, b: DatedScheduleSlot): number {
  if (a.date !== b.date) {
    return a.date.localeCompare(b.date);
  }

  return a.startTime.localeCompare(b.startTime);
}

function slotMergeKey(slot: DatedScheduleSlot): string {
  const kind = inferScheduleSlotKind(slot.title, slot.kindHint);
  return [slot.date, slot.title, slot.creatorName, kind].join("\0");
}

function canMergeAdjacentSlots(
  current: DatedScheduleSlot,
  next: DatedScheduleSlot,
): boolean {
  return (
    slotMergeKey(current) === slotMergeKey(next) &&
    current.endTime === next.startTime
  );
}

/**
 * 같은 날짜·연습명·예약자·유형이고 시간이 맞닿은 연속 슬롯을 하나로 합칩니다.
 * 예: 15:00-17:00 + 17:00-19:00 → 15:00-19:00
 */
export function mergeAdjacentDatedScheduleSlots(
  slots: DatedScheduleSlot[],
): DatedScheduleSlot[] {
  if (slots.length <= 1) {
    return slots;
  }

  const sorted = [...slots].sort(compareSlots);
  const merged: DatedScheduleSlot[] = [];
  let current: DatedScheduleSlot = { ...sorted[0]! };

  for (let index = 1; index < sorted.length; index += 1) {
    const next = sorted[index]!;
    if (canMergeAdjacentSlots(current, next)) {
      current = {
        ...current,
        endTime: next.endTime,
      };
      continue;
    }

    merged.push(current);
    current = { ...next };
  }

  merged.push(current);
  return merged;
}
