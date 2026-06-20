"use client";

import {
  hasAssistantDetails,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import { ASSISTANT_LABELS } from "@admin/features/assistant/constants/assistant-labels";
import { cn } from "@admin/shared/lib/cn";
import { useAuiState } from "@assistant-ui/react";
import { ChevronDownIcon } from "lucide-react";
import { type FC, useMemo, useState } from "react";

function isAssistantAnalysis(value: unknown): value is AssistantAnalysis {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.summary === "string" &&
    typeof candidate.detected_text === "string" &&
    typeof candidate.recommended_action === "string"
  );
}

function AssistantAnalysisDetailsContent({
  analysis,
}: {
  analysis: AssistantAnalysis;
}) {
  const detectedText = analysis.detected_text.trim();
  const recommendedAction = analysis.recommended_action.trim();
  const missingFields = analysis.action?.missing_fields ?? [];

  return (
    <div className="space-y-3 text-xs leading-relaxed text-gray-600">
      {detectedText ? (
        <section>
          <p className="mb-1 font-medium text-gray-700">인식된 텍스트</p>
          <p className="whitespace-pre-wrap rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
            {detectedText}
          </p>
        </section>
      ) : null}

      {recommendedAction ? (
        <section>
          <p className="mb-1 font-medium text-gray-700">권장 작업</p>
          <p className="whitespace-pre-wrap">{recommendedAction}</p>
        </section>
      ) : null}

      {missingFields.length > 0 ? (
        <section>
          <p className="mb-1 font-medium text-gray-700">추가 입력 필요</p>
          <p>{missingFields.join(", ")}</p>
        </section>
      ) : null}
    </div>
  );
}

export const AssistantAnalysisDetails: FC = () => {
  const rawAnalysis = useAuiState(
    (state) => state.message.metadata?.custom?.analysis,
  );
  const analysis = useMemo(
    () => (isAssistantAnalysis(rawAnalysis) ? rawAnalysis : null),
    [rawAnalysis],
  );
  const [open, setOpen] = useState(false);

  if (!analysis || !hasAssistantDetails(analysis)) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="group flex w-full items-center gap-1.5 py-1 text-left text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
      >
        <ChevronDownIcon
          className={cn(
            "size-3.5 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
        <span>{ASSISTANT_LABELS.analysisDetails}</span>
      </button>
      {open ? (
        <div className="pt-2">
          <AssistantAnalysisDetailsContent analysis={analysis} />
        </div>
      ) : null}
    </div>
  );
};
