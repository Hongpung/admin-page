import type { AssistantToolDiscardImpactItem } from "@admin/features/assistant/lib/collect-tool-discard-impact";
import { TimeArray } from "@admin/features/reservation/constants/constants";

function sortImpacts(impacts: AssistantToolDiscardImpactItem[]) {
  return [...impacts].sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    const startDiff =
      TimeArray.indexOf(a.startTime as (typeof TimeArray)[number]) -
      TimeArray.indexOf(b.startTime as (typeof TimeArray)[number]);
    if (startDiff !== 0) return startDiff;
    return a.reservationId - b.reservationId;
  });
}

export function formatAssistantToolDiscardImpactLine(
  impact: AssistantToolDiscardImpactItem,
): string {
  return `${impact.date} · ${impact.title} (${impact.creatorName}) · ${impact.startTime}~${impact.endTime}`;
}

export function formatAssistantToolDiscardImpacts(
  impacts: AssistantToolDiscardImpactItem[],
): string[] {
  return sortImpacts(impacts).map(formatAssistantToolDiscardImpactLine);
}
