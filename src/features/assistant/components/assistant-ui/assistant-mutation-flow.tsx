"use client";

import { AssistantActionBlockedCard } from "@admin/features/assistant/components/assistant-ui/assistant-action-blocked-card";
import { AssistantActionCardContent } from "@admin/features/assistant/components/assistant-ui/assistant-action-card";
import { AssistantActionHistory } from "@admin/features/assistant/components/assistant-ui/assistant-action-history";
import { AssistantFollowUp } from "@admin/features/assistant/components/assistant-ui/assistant-follow-up";
import { AssistantInputCard } from "@admin/features/assistant/components/assistant-ui/assistant-input-card";
import { resolveAssistantAction } from "@admin/features/assistant/lib/resolve-assistant-action";
import { hasAssistantActionInputGap } from "@admin/features/assistant/lib/assistant-action-input-state";
import {
  getStoredAssistantAnalysis,
  setStoredAssistantAnalysis,
} from "@admin/features/assistant/lib/assistant-session-storage";
import {
  getCurrentAssistantAction,
  hasAssistantFollowUp,
  normalizeAssistantActions,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import { useAuiState } from "@assistant-ui/react";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";

function isAssistantAnalysis(value: unknown): value is AssistantAnalysis {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.summary === "string" &&
    typeof candidate.detected_text === "string" &&
    typeof candidate.recommended_action === "string"
  );
}

const TERMINAL_ACTION_STATUSES = new Set([
  "success",
  "error",
  "rejected",
  "completed",
  "cancelled",
]);

function countCompletedActions(analysis: AssistantAnalysis): number {
  return normalizeAssistantActions(analysis).filter(
    (action) => action.status && TERMINAL_ACTION_STATUSES.has(action.status),
  ).length;
}

function isAnalysisMoreProgressed(
  candidate: AssistantAnalysis,
  baseline: AssistantAnalysis,
): boolean {
  if (candidate.admin_action_required !== baseline.admin_action_required) {
    return !candidate.admin_action_required;
  }

  const candidateCompleted = countCompletedActions(candidate);
  const baselineCompleted = countCompletedActions(baseline);
  if (candidateCompleted !== baselineCompleted) {
    return candidateCompleted > baselineCompleted;
  }

  if (candidate.recommended_action.trim() !== baseline.recommended_action.trim()) {
    return candidate.recommended_action.trim().length === 0;
  }

  return false;
}

function pickPreferredAnalysis(
  candidates: AssistantAnalysis[],
): AssistantAnalysis | null {
  if (candidates.length === 0) return null;
  return candidates.reduce((best, next) =>
    isAnalysisMoreProgressed(next, best) ? next : best,
  );
}

export const AssistantMutationFlow: FC = () => {
  const rawAnalysis = useAuiState(
    (state) => state.message.metadata?.custom?.analysis,
  );
  const rawRoomId = useAuiState(
    (state) => state.message.metadata?.custom?.roomId,
  );

  const metadataAnalysis = useMemo(
    () => (isAssistantAnalysis(rawAnalysis) ? rawAnalysis : null),
    [rawAnalysis],
  );
  const roomId = typeof rawRoomId === "string" ? rawRoomId : null;

  const [analysis, setAnalysis] = useState<AssistantAnalysis | null>(
    metadataAnalysis,
  );
  const [editFailedAction, setEditFailedAction] = useState(false);

  const handleAnalysisUpdate = useCallback(
    (next: AssistantAnalysis) => {
      setAnalysis(next);
      if (roomId) {
        setStoredAssistantAnalysis(roomId, next);
      }
    },
    [roomId],
  );

  useEffect(() => {
    if (!metadataAnalysis) {
      setAnalysis(null);
      return;
    }

    const stored = roomId ? getStoredAssistantAnalysis(roomId) : null;
    const preferred = pickPreferredAnalysis(
      [stored, metadataAnalysis].filter(
        (item): item is AssistantAnalysis => item !== null,
      ),
    );

    setAnalysis((current) => {
      const candidates = [current, preferred, metadataAnalysis].filter(
        (item): item is AssistantAnalysis => item !== null,
      );
      return pickPreferredAnalysis(candidates) ?? metadataAnalysis;
    });
    setEditFailedAction(false);
  }, [metadataAnalysis, roomId]);

  const actionState = useMemo(
    () => (analysis ? resolveAssistantAction(analysis) : null),
    [analysis],
  );

  if (!analysis) {
    return null;
  }

  const followUp = hasAssistantFollowUp(analysis) ? (
    <AssistantFollowUp analysis={analysis} />
  ) : null;
  const history = <AssistantActionHistory analysis={analysis} />;

  if (!actionState || actionState.kind === "none") {
    return (
      <>
        {followUp}
        {history}
      </>
    );
  }

  if (actionState.kind === "need_input") {
    return (
      <>
        {followUp}
        {history}
        <AssistantInputCard
          key={actionState.actionId ?? "need-input"}
          analysis={analysis}
          roomId={roomId}
          onUpdated={handleAnalysisUpdate}
        />
      </>
    );
  }

  if (actionState.kind === "failed" && editFailedAction) {
    return (
      <>
        {followUp}
        {history}
        <AssistantInputCard
          key={`${actionState.actionId ?? "failed"}-edit`}
          analysis={analysis}
          roomId={roomId}
          mode="edit"
          onUpdated={(next) => {
            setEditFailedAction(false);
            handleAnalysisUpdate(next);
          }}
        />
      </>
    );
  }

  if (actionState.kind === "failed" || actionState.kind === "blocked") {
    return (
      <>
        {followUp}
        {history}
        <AssistantActionBlockedCard
          state={actionState}
          roomId={roomId}
          onUpdated={handleAnalysisUpdate}
          onEdit={
            actionState.kind === "failed"
              ? () => setEditFailedAction(true)
              : undefined
          }
        />
      </>
    );
  }

  if (actionState.kind === "confirm") {
    return (
      <>
        {followUp}
        {history}
        <AssistantActionCardContent
          key={actionState.actionId ?? actionState.toolId}
          state={actionState}
          roomId={roomId}
          onUpdated={handleAnalysisUpdate}
        />
      </>
    );
  }

  if (
    (actionState.kind === "invalid" || actionState.kind === "manual") &&
    hasAssistantActionInputGap(getCurrentAssistantAction(analysis))
  ) {
    return (
      <>
        {followUp}
        {history}
        <AssistantInputCard
          key={getCurrentAssistantAction(analysis)?.id ?? "need-input-fallback"}
          analysis={analysis}
          roomId={roomId}
          onUpdated={handleAnalysisUpdate}
        />
      </>
    );
  }

  return history;
};
