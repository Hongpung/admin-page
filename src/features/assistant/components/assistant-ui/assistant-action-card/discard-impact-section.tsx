import { ASSISTANT_LABELS } from "@admin/features/assistant/constants/assistant-labels";
import { formatAssistantToolDiscardImpactLine } from "@admin/features/assistant/lib/format-tool-discard-impact";
import type { AssistantToolDiscardImpactItem } from "@admin/features/assistant/lib/collect-tool-discard-impact";
import { Button } from "@admin/shared/components/ui/button";

import type { ImpactStatus } from "./helpers";

type DiscardImpactSectionProps = {
  impacts: AssistantToolDiscardImpactItem[];
  impactStatus: ImpactStatus;
  onRetry: () => void;
  isDeleteTool: boolean;
};

export function DiscardImpactSection({
  impacts,
  impactStatus,
  onRetry,
  isDeleteTool,
}: DiscardImpactSectionProps) {
  const labels = isDeleteTool
    ? {
        loadFailed: ASSISTANT_LABELS.actionImpactLoadFailedDelete,
        title: ASSISTANT_LABELS.actionImpactTitleDelete,
        description: ASSISTANT_LABELS.actionImpactDescriptionDelete,
      }
    : {
        loadFailed: ASSISTANT_LABELS.actionImpactLoadFailed,
        title: ASSISTANT_LABELS.actionImpactTitle,
        description: ASSISTANT_LABELS.actionImpactDescription,
      };

  if (impactStatus === "loading") {
    return null;
  }

  if (impactStatus === "ready" && impacts.length === 0) {
    return null;
  }

  if (impactStatus === "error") {
    return (
      <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2">
        <p className="text-xs text-red-800">{labels.loadFailed}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2 h-7 border-red-200 text-xs"
          onClick={onRetry}
        >
          {ASSISTANT_LABELS.actionImpactRetry}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-red-200 bg-red-50/70 px-3 py-2">
      <p className="text-xs font-semibold text-red-900">{labels.title}</p>
      <p className="mt-1 text-xs text-red-800">{labels.description}</p>
      <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-red-900">
        {impacts.map((impact) => (
          <li
            key={`${impact.reservationId}-${impact.date}`}
            className="rounded border border-red-100 bg-white/80 px-2 py-1.5"
          >
            {formatAssistantToolDiscardImpactLine(impact)}
          </li>
        ))}
      </ul>
    </div>
  );
}
