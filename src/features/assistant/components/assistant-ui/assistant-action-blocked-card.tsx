"use client";

import { assistantAnalysisSchema } from "@admin/features/assistant/types/assistant-analysis.types";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";
import type {
  AssistantActionBlockedState,
  AssistantActionFailedState,
} from "@admin/features/assistant/types/assistant-tool.types";
import { ASSISTANT_LABELS } from "@admin/features/assistant/constants/assistant-labels";
import { Button } from "@admin/shared/components/ui/button";
import { AlertTriangleIcon, Loader2Icon } from "lucide-react";
import { type FC, useState } from "react";

async function postDraftQueueControl(args: {
  roomId: string;
  analysis: AssistantAnalysis;
  cancelCurrent?: boolean;
  retryCurrent?: boolean;
  actionId?: string;
}): Promise<AssistantAnalysis | null> {
  const response = await fetch("/api/assistant/draft-state", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(args),
  });

  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) return null;

  const parsed = assistantAnalysisSchema.safeParse(
    payload &&
      typeof payload === "object" &&
      "analysis" in payload &&
      (payload as { analysis: unknown }).analysis,
  );

  return parsed.success ? parsed.data : null;
}

async function clearDraftQueue(args: {
  roomId: string;
  analysis: AssistantAnalysis;
}): Promise<AssistantAnalysis | null> {
  const response = await fetch("/api/assistant/draft-state", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ roomId: args.roomId }),
  });

  if (!response.ok) return null;

  return {
    ...args.analysis,
    admin_action_required: false,
    recommended_action: "",
    action: { type: "NONE" },
    actions: [{ type: "NONE" }],
  };
}

type BlockedCardProps = {
  state: AssistantActionFailedState | AssistantActionBlockedState;
  roomId: string | null;
  onUpdated: (analysis: AssistantAnalysis) => void;
  onEdit?: () => void;
};

export const AssistantActionBlockedCard: FC<BlockedCardProps> = ({
  state,
  roomId,
  onUpdated,
  onEdit,
}) => {
  const [status, setStatus] = useState<"idle" | "working">("idle");

  const title =
    state.kind === "failed"
      ? ASSISTANT_LABELS.actionFailedTitle
      : ASSISTANT_LABELS.actionBlockedTitle;

  const primaryMessage =
    state.kind === "blocked" && state.reason === "unsupported"
      ? `${state.label}은(는) 지원하지 않습니다.`
      : state.kind === "failed"
        ? `${state.label} 실행에 실패했습니다.`
        : state.message;

  const handleContinue = async () => {
    if (!roomId) return;
    setStatus("working");
    const nextAnalysis = await postDraftQueueControl({
      roomId,
      analysis: state.analysis,
      cancelCurrent: true,
    });
    setStatus("idle");
    if (nextAnalysis) onUpdated(nextAnalysis);
  };

  const handleRetry = async () => {
    if (!roomId || state.kind !== "failed") return;
    setStatus("working");
    const nextAnalysis = await postDraftQueueControl({
      roomId,
      analysis: state.analysis,
      retryCurrent: true,
      actionId: state.actionId,
    });
    setStatus("idle");
    if (nextAnalysis) onUpdated(nextAnalysis);
  };

  const handleStop = async () => {
    if (!roomId) return;
    setStatus("working");
    const nextAnalysis = await clearDraftQueue({
      roomId,
      analysis: state.analysis,
    });
    setStatus("idle");
    if (nextAnalysis) onUpdated(nextAnalysis);
  };

  const queueLabel =
    state.queueProgress && state.queueProgress.total > 1
      ? ASSISTANT_LABELS.actionQueueProgress(
          state.queueProgress.index,
          state.queueProgress.total,
        )
      : null;

  return (
    <div className="mt-3 rounded-xl border border-red-200 bg-red-50/70 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-red-700" />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {queueLabel ? (
              <p className="mt-1 text-xs font-medium text-red-800">{queueLabel}</p>
            ) : null}
            <p className="mt-1 text-xs text-red-900">{primaryMessage}</p>
            {state.message && state.kind === "failed" ? (
              <p className="mt-1 text-xs text-red-800">{state.message}</p>
            ) : null}
            {state.canContinue ? (
              <p className="mt-2 text-xs font-medium text-gray-800">
                {ASSISTANT_LABELS.actionContinuePrompt}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {state.kind === "failed" ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleRetry()}
                  disabled={status === "working" || !roomId}
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  {status === "working" ? (
                    <>
                      <Loader2Icon className="size-3.5 animate-spin" />
                      {ASSISTANT_LABELS.actionExecuting}
                    </>
                  ) : (
                    ASSISTANT_LABELS.actionRetry
                  )}
                </Button>
                {onEdit ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onEdit}
                    disabled={status === "working"}
                  >
                    {ASSISTANT_LABELS.actionEditPayload}
                  </Button>
                ) : null}
              </>
            ) : null}

            {state.canContinue ? (
              <Button
                type="button"
                size="sm"
                variant={state.kind === "failed" ? "outline" : "default"}
                onClick={() => void handleContinue()}
                disabled={status === "working" || !roomId}
                className={
                  state.kind === "blocked"
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : undefined
                }
              >
                {ASSISTANT_LABELS.actionContinueYes}
              </Button>
            ) : null}

            {state.canContinue ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleStop()}
                disabled={status === "working"}
              >
                {ASSISTANT_LABELS.actionContinueNo}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
