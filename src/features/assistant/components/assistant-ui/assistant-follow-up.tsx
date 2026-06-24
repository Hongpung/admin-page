"use client";

import { formatActionInputContextLine } from "@admin/features/assistant/lib/format-assistant-action-input-context";
import { resolveAssistantAction } from "@admin/features/assistant/lib/resolve-assistant-action";
import {
  getCurrentAssistantAction,
  hasAssistantFollowUp,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import { ASSISTANT_LABELS } from "@admin/features/assistant/constants/assistant-labels";
import { useAuiState } from "@assistant-ui/react";
import { ArrowRightIcon } from "lucide-react";
import { type FC, useMemo } from "react";

function isAssistantAnalysis(value: unknown): value is AssistantAnalysis {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.summary === "string" &&
    typeof candidate.detected_text === "string" &&
    typeof candidate.recommended_action === "string"
  );
}

export const AssistantFollowUp: FC<{
  analysis?: AssistantAnalysis | null;
}> = ({ analysis: analysisOverride }) => {
  const rawAnalysis = useAuiState(
    (state) => state.message.metadata?.custom?.analysis,
  );
  const analysis = useMemo(() => {
    if (analysisOverride) return analysisOverride;
    return isAssistantAnalysis(rawAnalysis) ? rawAnalysis : null;
  }, [analysisOverride, rawAnalysis]);

  if (!analysis || !hasAssistantFollowUp(analysis)) {
    return null;
  }

  const recommendedAction = analysis.recommended_action.trim();
  const action = getCurrentAssistantAction(analysis);
  const actionState = resolveAssistantAction(analysis);
  const queueProgress =
    actionState.kind === "need_input" ? actionState.queueProgress : undefined;
  const payload = (action?.payload ?? {}) as Record<string, unknown>;
  const targetContextLine = formatActionInputContextLine(
    action?.type,
    payload,
    queueProgress,
  );
  const missingFields = action?.missing_fields ?? [];
  const hasFormItems = (action?.missing_field_items?.length ?? 0) > 0;
  const showMissingList =
    missingFields.length > 0 &&
    !hasFormItems &&
    !recommendedAction.includes("아래 필드가 더 필요합니다");

  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-3">
      <div className="flex items-start gap-2">
        <ArrowRightIcon className="mt-0.5 size-4 shrink-0 text-blue-700" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-gray-900">
            {ASSISTANT_LABELS.followUpTitle}
          </p>

          {targetContextLine ? (
            <p className="rounded-md border border-blue-100 bg-white px-2.5 py-2 text-sm leading-snug text-gray-900">
              <span className="text-xs font-medium text-blue-800">
                {ASSISTANT_LABELS.inputCardTargetLabel}
              </span>{" "}
              {targetContextLine}
            </p>
          ) : null}

          {recommendedAction ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {recommendedAction}
            </p>
          ) : null}

          {showMissingList ? (
            <div>
              <p className="text-xs font-medium text-gray-700">
                {ASSISTANT_LABELS.followUpMissingFields}
              </p>
              <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-gray-700">
                {missingFields.map((field) => (
                  <li
                    key={field}
                    className="rounded-md border border-blue-100 bg-white px-2 py-1"
                  >
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
