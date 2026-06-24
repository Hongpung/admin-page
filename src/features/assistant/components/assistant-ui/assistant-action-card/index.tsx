"use client";

import { ASSISTANT_LABELS } from "@admin/features/assistant/constants/assistant-labels";
import type { AssistantToolDiscardImpactItem } from "@admin/features/assistant/lib/collect-tool-discard-impact";
import { formatAssistantToolArgsPreview } from "@admin/features/assistant/lib/format-tool-args-preview";
import { resolveAssistantAction } from "@admin/features/assistant/lib/resolve-assistant-action";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";
import {
  isAssistantDeleteToolId,
  type AssistantActionConfirmState,
} from "@admin/features/assistant/types/assistant-tool.types";
import { Button } from "@admin/shared/components/ui/button";
import { cn } from "@admin/shared/lib/cn";
import { useAuiState } from "@assistant-ui/react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  Loader2Icon,
} from "lucide-react";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";

import { DiscardImpactSection } from "./discard-impact-section";
import {
  cancelCurrentDraftAction,
  executeConfirmedTool,
  fetchDiscardImpact,
  isAssistantAnalysis,
  type ActionCardStatus,
  type ImpactStatus,
} from "./helpers";

export function AssistantActionCardContent({
  state,
  roomId,
  onUpdated,
}: {
  state: AssistantActionConfirmState;
  roomId: string | null;
  onUpdated?: (analysis: AssistantAnalysis) => void;
}) {
  const [status, setStatus] = useState<ActionCardStatus>("pending");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [impactStatus, setImpactStatus] = useState<ImpactStatus>("loading");
  const [impacts, setImpacts] = useState<AssistantToolDiscardImpactItem[]>([]);

  const isDeleteTool = isAssistantDeleteToolId(state.toolId);

  const preview = useMemo(
    () => formatAssistantToolArgsPreview(state.toolId, state.args),
    [state.toolId, state.args],
  );

  const loadImpact = useCallback(
    async (signal?: AbortSignal) => {
      setImpactStatus("loading");
      try {
        const nextImpacts = await fetchDiscardImpact(state, signal);
        setImpacts(nextImpacts);
        setImpactStatus("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setImpactStatus("error");
      }
    },
    [state],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadImpact(controller.signal);
    return () => controller.abort();
  }, [loadImpact]);

  const handleReject = async () => {
    setStatus("rejected");
    setResultMessage(ASSISTANT_LABELS.actionRejected);

    const nextAnalysis = await cancelCurrentDraftAction(roomId, state.analysis);
    if (nextAnalysis) {
      onUpdated?.(nextAnalysis);
    }
  };

  const handleConfirm = async () => {
    setStatus("executing");
    setResultMessage(null);

    try {
      const result = await executeConfirmedTool(state, roomId);
      if (result.ok) {
        setStatus("success");
        setResultMessage(
          result.queueComplete
            ? result.briefing ?? result.message
            : `${result.message} ${ASSISTANT_LABELS.actionQueueNext}`,
        );
        if (result.analysis) {
          onUpdated?.(result.analysis);
        }
        return;
      }

      setStatus("error");
      setResultMessage(result.message);
      if (result.analysis) {
        onUpdated?.(result.analysis);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("pending");
        return;
      }

      setStatus("error");
      setResultMessage(ASSISTANT_LABELS.actionExecuteFailed);
    }
  };

  const queueLabel =
    state.queueProgress && state.queueProgress.total > 1
      ? ASSISTANT_LABELS.actionQueueProgress(
          state.queueProgress.index,
          state.queueProgress.total,
        )
      : null;

  const isPending = status === "pending";
  const isExecuting = status === "executing";
  const canApprove = impactStatus === "ready" && isPending;

  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-700" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {ASSISTANT_LABELS.actionConfirmTitle}
          </p>
          {queueLabel ? (
            <p className="mt-1 text-xs font-medium text-amber-800">{queueLabel}</p>
          ) : null}
          <p className="mt-1 text-xs text-gray-600">
            {ASSISTANT_LABELS.actionConfirmDescription}
          </p>
          <p className="mt-2 text-xs font-medium text-gray-700">{state.label}</p>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-amber-100 bg-white px-3 py-2 text-xs leading-relaxed text-gray-700">
            {preview}
          </pre>

          {isPending || isExecuting ? (
            <DiscardImpactSection
              impacts={impacts}
              impactStatus={impactStatus}
              onRetry={() => void loadImpact()}
              isDeleteTool={isDeleteTool}
            />
          ) : null}

          {resultMessage ? (
            <p
              className={cn(
                "mt-2 text-xs",
                status === "success" && "text-emerald-700",
                status === "error" && "text-red-700",
                status === "rejected" && "text-gray-600",
              )}
            >
              {status === "success" ? (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2Icon className="size-3.5" />
                  {resultMessage}
                </span>
              ) : (
                resultMessage
              )}
            </p>
          ) : null}

          {isPending || isExecuting ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => void handleConfirm()}
                disabled={!canApprove || isExecuting}
                className="bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" />
                    {ASSISTANT_LABELS.actionExecuting}
                  </>
                ) : (
                  ASSISTANT_LABELS.actionApprove
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleReject()}
                disabled={isExecuting}
              >
                {ASSISTANT_LABELS.actionReject}
              </Button>
            </div>
          ) : status === "error" ? (
            <div className="mt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setStatus("pending");
                  setResultMessage(null);
                }}
              >
                {ASSISTANT_LABELS.actionRetry}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const AssistantActionCard: FC = () => {
  const rawAnalysis = useAuiState(
    (state) => state.message.metadata?.custom?.analysis,
  );
  const rawRoomId = useAuiState(
    (state) => state.message.metadata?.custom?.roomId,
  );
  const analysis = useMemo(
    () => (isAssistantAnalysis(rawAnalysis) ? rawAnalysis : null),
    [rawAnalysis],
  );
  const roomId = typeof rawRoomId === "string" ? rawRoomId : null;

  const actionState = useMemo(
    () => (analysis ? resolveAssistantAction(analysis) : null),
    [analysis],
  );

  if (!actionState || actionState.kind !== "confirm") {
    return null;
  }

  return <AssistantActionCardContent state={actionState} roomId={roomId} />;
};
