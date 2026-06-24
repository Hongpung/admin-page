import "server-only";

import {
  enrichAndPrefetchScheduleDraftQueue,
  mergeAssistantAnalysisIntoDraft,
  mergeAssistantAnalysisIntoDraftWithPrefetch,
  resolveCurrentQueuedAction,
} from "@admin/features/assistant/lib/assistant-draft";
import {
  clearAssistantDraft,
  getAssistantDraft,
} from "@admin/features/assistant/lib/assistant-draft-store";
import { findCurrentQueuedAction } from "@admin/features/assistant/lib/assistant-action-queue";
import { shouldResolveQueuedAction } from "@admin/features/assistant/lib/assistant-action-resolution";
import { logAssistantDebug } from "@admin/features/assistant/lib/assistant-debug-log";
import {
  buildBatchActionsFromDatedScheduleMessage,
} from "@admin/features/assistant/lib/build-batch-actions-from-dated-schedule";
import { buildBatchActionsFromScheduleText } from "@admin/features/assistant/lib/build-batch-actions-from-schedule";
import { buildCreateReservationsFromScheduleMessage } from "@admin/features/assistant/lib/build-create-reservations-from-schedule";
import { buildDatedScheduleBuildFailureAnalysis } from "@admin/features/assistant/lib/build-dated-schedule-failure-analysis";
import { isDatedPracticeScheduleText } from "@admin/features/assistant/lib/extract-dated-schedule-slots";
import {
  extractScheduleFromImage,
  imageExtractionToAnalysis,
  type ImageExtractionResult,
} from "@admin/features/assistant/lib/google-genai";
import { loadClubLeaders } from "@admin/features/assistant/lib/load-club-leaders";
import {
  resolveScheduleRequestPeriod,
  shouldUseBatchScheduleForPeriod,
} from "@admin/features/assistant/lib/resolve-schedule-request-period";
import type {
  AssistantAction,
  AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import type { AssistantDraftKey } from "@admin/features/assistant/types/assistant-draft.types";
import type { AssistantAnalyzeProgressHandler } from "@admin/features/assistant/types/assistant-stream.types";

export type BootstrapAssistantImageDraftInput = {
  token: string;
  message: string;
  image: File;
  draftKey: AssistantDraftKey;
  currentDraftHasQueue: boolean;
  onProgress?: AssistantAnalyzeProgressHandler;
};

export type BootstrapAssistantImageDraftResult = {
  imageExtraction: ImageExtractionResult;
  aiCallsUsed: number;
  prebuiltScheduleActions: AssistantAction[] | null;
  scheduleBuildSucceeded: boolean;
  datedScheduleBuildFailed: boolean;
};

function buildScheduleAnalysis(
  imageExtraction: ImageExtractionResult,
  actions: AssistantAction[],
): AssistantAnalysis {
  return {
    summary: "",
    detected_text: imageExtraction.detected_text,
    admin_action_required: true,
    recommended_action: "",
    confidence: imageExtraction.confidence,
    fallback_required: false,
    actions,
    action: actions[0],
  };
}

function logDraftBeforeMerge(
  draftKey: AssistantDraftKey,
  incoming: AssistantAnalysis,
) {
  logAssistantDebug("draft:before-image-merge", {
    incoming,
    existing: getAssistantDraft(draftKey),
  });
}

function logDraftAfterMerge(snapshot: unknown) {
  logAssistantDebug("draft:after-image-merge", snapshot);
}

async function buildImageScheduleActions(args: {
  token: string;
  message: string;
  imageExtraction: ImageExtractionResult;
}) {
  const { token, message, imageExtraction } = args;
  let prebuiltScheduleActions: AssistantAction[] | null = null;
  let builtReservationActions: AssistantAction[] = [];
  let prebuiltActionLogKey: "schedule-build:batch-actions" | "schedule-build:actions" | null =
    null;

  const scheduleCombinedText = `${message}\n${imageExtraction.detected_text}`;
  const datedPracticeSchedule = isDatedPracticeScheduleText(scheduleCombinedText);
  const schedulePeriod = resolveScheduleRequestPeriod(
    message,
    imageExtraction.detected_text,
  );
  const useBatchForSchedulePeriod =
    datedPracticeSchedule &&
    shouldUseBatchScheduleForPeriod(message, imageExtraction.detected_text);

  try {
    if (useBatchForSchedulePeriod) {
      prebuiltScheduleActions = await buildBatchActionsFromDatedScheduleMessage(
        token,
        message,
        imageExtraction.detected_text,
        schedulePeriod,
      );
      prebuiltActionLogKey = "schedule-build:batch-actions";
    } else if (datedPracticeSchedule) {
      builtReservationActions = await buildCreateReservationsFromScheduleMessage(
        token,
        message,
        imageExtraction.detected_text,
      );
    }
  } catch (buildError) {
    console.error("시간표 예약 빌드 실패:", buildError);
  }

  const scheduleBuildSucceeded =
    builtReservationActions.length > 0 ||
    (prebuiltScheduleActions?.length ?? 0) > 0;
  const datedScheduleBuildFailed = datedPracticeSchedule && !scheduleBuildSucceeded;

  if (!datedPracticeSchedule && (prebuiltScheduleActions?.length ?? 0) === 0) {
    try {
      const leaders = await loadClubLeaders(token);
      prebuiltScheduleActions = buildBatchActionsFromScheduleText(
        message,
        imageExtraction.detected_text,
        leaders,
      );
    } catch (leaderError) {
      console.error("동아리 패짱 목록 조회 실패:", leaderError);
      prebuiltScheduleActions = buildBatchActionsFromScheduleText(
        message,
        imageExtraction.detected_text,
      );
    }

    if ((prebuiltScheduleActions?.length ?? 0) > 0) {
      prebuiltActionLogKey = "schedule-build:actions";
    }
  }

  return {
    builtReservationActions,
    prebuiltScheduleActions,
    prebuiltActionLogKey,
    scheduleBuildSucceeded,
    datedScheduleBuildFailed,
  };
}

async function mergeImageAnalysisIntoDraftState(args: {
  token: string;
  message: string;
  draftKey: AssistantDraftKey;
  imageExtraction: ImageExtractionResult;
  builtReservationActions: AssistantAction[];
  prebuiltScheduleActions: AssistantAction[] | null;
  prebuiltActionLogKey: "schedule-build:batch-actions" | "schedule-build:actions" | null;
  datedScheduleBuildFailed: boolean;
}) {
  const {
    token,
    message,
    draftKey,
    imageExtraction,
    builtReservationActions,
    prebuiltScheduleActions,
    prebuiltActionLogKey,
    datedScheduleBuildFailed,
  } = args;

  if (builtReservationActions.length > 0) {
    const scheduleAnalysis = buildScheduleAnalysis(
      imageExtraction,
      builtReservationActions,
    );
    logAssistantDebug(
      "schedule-build:create-reservations",
      builtReservationActions,
    );
    logDraftBeforeMerge(draftKey, scheduleAnalysis);
    mergeAssistantAnalysisIntoDraft(draftKey, scheduleAnalysis);
    const prefetchedSnapshot = await enrichAndPrefetchScheduleDraftQueue(
      draftKey,
      token,
      message,
      imageExtraction.detected_text,
    );
    logAssistantDebug("draft:after-schedule-prefetch", prefetchedSnapshot);
    return;
  }

  if ((prebuiltScheduleActions?.length ?? 0) > 0) {
    const scheduleAnalysis = buildScheduleAnalysis(
      imageExtraction,
      prebuiltScheduleActions ?? [],
    );
    if (prebuiltActionLogKey) {
      logAssistantDebug(prebuiltActionLogKey, prebuiltScheduleActions);
    }
    logDraftBeforeMerge(draftKey, scheduleAnalysis);
    const snapshot = await mergeAssistantAnalysisIntoDraftWithPrefetch(
      draftKey,
      scheduleAnalysis,
      token,
      message,
    );
    logDraftAfterMerge(snapshot);
    return;
  }

  if (datedScheduleBuildFailed) {
    const failedAnalysis =
      buildDatedScheduleBuildFailureAnalysis(imageExtraction);
    logAssistantDebug("schedule-build:failed", failedAnalysis);
    logDraftBeforeMerge(draftKey, failedAnalysis);
    const snapshot = mergeAssistantAnalysisIntoDraft(draftKey, failedAnalysis);
    logDraftAfterMerge(snapshot);
    return;
  }

  const imageAnalysis = imageExtractionToAnalysis(imageExtraction);
  logDraftBeforeMerge(draftKey, imageAnalysis);
  const snapshot = mergeAssistantAnalysisIntoDraft(draftKey, imageAnalysis);
  logDraftAfterMerge(snapshot);
}

export async function bootstrapAssistantImageDraft(
  input: BootstrapAssistantImageDraftInput,
): Promise<BootstrapAssistantImageDraftResult> {
  const { token, message, image, draftKey, currentDraftHasQueue, onProgress } =
    input;

  onProgress?.({ type: "status", message: "이미지 내용을 분석하고 있어요…" });
  if (currentDraftHasQueue) {
    logAssistantDebug("draft:clear-before-image", getAssistantDraft(draftKey));
    clearAssistantDraft(draftKey);
  }

  const imageExtraction = await extractScheduleFromImage({
    message,
    image: {
      buffer: Buffer.from(await image.arrayBuffer()),
      mimeType: image.type || "image/jpeg",
    },
  });

  onProgress?.({
    type: "status",
    message: "동아리 패짱 정보를 확인하고 있어요…",
  });

  const {
    builtReservationActions,
    prebuiltScheduleActions,
    prebuiltActionLogKey,
    scheduleBuildSucceeded,
    datedScheduleBuildFailed,
  } = await buildImageScheduleActions({
    token,
    message,
    imageExtraction,
  });

  await mergeImageAnalysisIntoDraftState({
    token,
    message,
    draftKey,
    imageExtraction,
    builtReservationActions,
    prebuiltScheduleActions,
    prebuiltActionLogKey,
    datedScheduleBuildFailed,
  });

  let aiCallsUsed = 1;
  const draftAfterImage = getAssistantDraft(draftKey);
  const currentAfterImage = draftAfterImage
    ? findCurrentQueuedAction(draftAfterImage.queue)
    : null;

  if (
    builtReservationActions.length === 0 &&
    currentAfterImage &&
    shouldResolveQueuedAction(currentAfterImage)
  ) {
    onProgress?.({
      type: "status",
      message: "예약 정보를 확인하고 있어요…",
    });
    const resolution = await resolveCurrentQueuedAction({
      token,
      key: draftKey,
      userMessage: message,
      detectedText: imageExtraction.detected_text,
    });
    aiCallsUsed += resolution.aiCallsUsed;
    logAssistantDebug("action-resolution:snapshot", resolution.snapshot);
  }

  return {
    imageExtraction,
    aiCallsUsed,
    prebuiltScheduleActions,
    scheduleBuildSucceeded,
    datedScheduleBuildFailed,
  };
}
