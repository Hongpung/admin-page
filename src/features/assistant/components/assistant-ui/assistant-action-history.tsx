"use client";

import { getAssistantActionLabel } from "@admin/features/assistant/lib/get-assistant-action-label";
import { getTerminalActionsForHistory } from "@admin/features/assistant/lib/assistant-queue-progress";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";
import { ASSISTANT_LABELS } from "@admin/features/assistant/constants/assistant-labels";
import { cn } from "@admin/shared/lib/cn";
import {
  BanIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from "lucide-react";
import type { FC } from "react";

function historyStatusLabel(status: string | undefined) {
  switch (status) {
    case "success":
    case "completed":
      return ASSISTANT_LABELS.actionHistorySuccess;
    case "rejected":
    case "cancelled":
      return ASSISTANT_LABELS.actionHistoryCancelled;
    default:
      return ASSISTANT_LABELS.actionHistorySkipped;
  }
}

function historyStatusIcon(status: string | undefined) {
  switch (status) {
    case "success":
    case "completed":
      return <CheckCircle2Icon className="size-3.5 text-emerald-600" />;
    case "rejected":
    case "cancelled":
      return <BanIcon className="size-3.5 text-gray-500" />;
    default:
      return <XCircleIcon className="size-3.5 text-amber-600" />;
  }
}

export const AssistantActionHistory: FC<{ analysis: AssistantAnalysis }> = ({
  analysis,
}) => {
  const history = getTerminalActionsForHistory(analysis);
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3">
      <p className="text-xs font-semibold text-gray-800">
        {ASSISTANT_LABELS.actionHistoryTitle}
      </p>
      <ul className="mt-2 space-y-1.5">
        {history.map((action, index) => (
          <li
            key={action.id ?? `${action.type}-${index}`}
            className="flex items-center justify-between gap-2 rounded-md border border-gray-100 bg-white px-2.5 py-2 text-xs"
          >
            <span className="inline-flex min-w-0 items-center gap-1.5 text-gray-800">
              {historyStatusIcon(action.status)}
              <span className="truncate">{getAssistantActionLabel(action.type)}</span>
            </span>
            <span
              className={cn(
                "shrink-0 font-medium",
                action.status === "success" || action.status === "completed"
                  ? "text-emerald-700"
                  : "text-gray-500",
              )}
            >
              {historyStatusLabel(action.status)}
            </span>
          </li>
        ))}
      </ul>
      {analysis.execution_briefing ? (
        <div className="mt-3 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2">
          <p className="text-xs font-semibold text-emerald-900">
            {ASSISTANT_LABELS.actionExecutionBriefingTitle}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-emerald-800">
            {analysis.execution_briefing}
          </p>
        </div>
      ) : null}
    </div>
  );
};
