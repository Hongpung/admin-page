import type { OccupiedReservation } from "../types";
import { TimeArray } from "../constants/constants";
import { RESERVATION_MESSAGE } from "../constants/reservation-message.constants";

type SubmitAction = "create" | "edit";

function sortConflictsByTime(conflicts: OccupiedReservation[]) {
  return [...conflicts].sort((a, b) => {
    const startDiff =
      TimeArray.indexOf(a.startTime) - TimeArray.indexOf(b.startTime);
    if (startDiff !== 0) return startDiff;
    return TimeArray.indexOf(a.endTime) - TimeArray.indexOf(b.endTime);
  });
}

export function formatReservationConflictConfirmBody(
  conflicts: OccupiedReservation[],
): string {
  return sortConflictsByTime(conflicts)
    .map((r) => `${r.title} / ${r.creatorName} / ${r.startTime}~${r.endTime}\n`)
    .join("");
}

export function confirmWithConflictList(
  conflicts: OccupiedReservation[],
  intro: string,
): boolean {
  if (!conflicts.length) return true;
  return confirm(
    `${intro}(${conflicts.length})\n\n${formatReservationConflictConfirmBody(
      conflicts,
    )}\n그대로 진행하시겠습니까?`,
  );
}

export function confirmSubmitWithConflictList(
  conflicts: OccupiedReservation[],
  action: SubmitAction,
): boolean {
  const submitConfirmText =
    action === "create"
      ? RESERVATION_MESSAGE.submitCreateConfirm
      : RESERVATION_MESSAGE.submitEditConfirm;

  if (!conflicts.length) {
    return confirm(submitConfirmText);
  }

  const conflictLines = sortConflictsByTime(conflicts)
    .map(
      (conflict) =>
        `- ${conflict.title}\n(${conflict.startTime}~${conflict.endTime})`,
    )
    .join("\n");

  return confirm(
    `${RESERVATION_MESSAGE.submitConflictConfirmPrefix}\n\n${conflictLines}\n\n${RESERVATION_MESSAGE.submitConflictConfirmSuffix}`,
  );
}
