import "server-only";

import {
  checkAiUsage,
  getAiContext,
} from "@admin/features/assistant/lib/ai-main-server";
import {
  applyDraftSnapshotToAnalysis,
  enrichAndPrefetchScheduleDraftQueue,
  evaluateAssistantDraft,
  mergeAssistantAnalysisIntoDraftWithPrefetch,
} from "@admin/features/assistant/lib/assistant-draft";
import {
  getAssistantDraft,
} from "@admin/features/assistant/lib/assistant-draft-store";
import { runAssistantTextAnalysis } from "@admin/features/assistant/lib/run-assistant-text-analysis";
import { streamAssistantSummaryText } from "@admin/features/assistant/lib/stream-assistant-summary";
import { BFF_SDK_KEY_HEADER } from "@admin/features/assistant/constants/bff-sdk";
import { bootstrapAssistantImageDraft } from "@admin/features/assistant/lib/run-assistant-analyze.image";
import { formatAssistantSummary } from "@admin/features/assistant/types/assistant-analysis.types";
import type { AiUsageCheckRes } from "@admin/features/assistant/types/ai-api.types";
import { logAssistantDebug } from "@admin/features/assistant/lib/assistant-debug-log";
import type {
  AssistantAction,
  AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import type {
  AssistantAnalyzeProgressHandler,
  AssistantStreamEvent,
} from "@admin/features/assistant/types/assistant-stream.types";
import { encodeAssistantStreamEvent } from "@admin/features/assistant/types/assistant-stream.types";
import { assistantRoomIdSchema } from "@admin/features/assistant/types/ai-api.types";

export const ASSISTANT_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export type RunAssistantAnalyzeInput = {
  token: string;
  memberId: string;
  message: string;
  roomId: string;
  image?: File | null;
  onProgress?: AssistantAnalyzeProgressHandler;
  signal?: AbortSignal;
};

export type RunAssistantAnalyzeResult = {
  analysis: AssistantAnalysis;
  roomId: string;
  aiCallsUsed: number;
  usage: NonNullable<AssistantAnalysis["usage"]>;
};

export class AssistantAnalyzeRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function mapUsageToAnalysisUsage(usage: AiUsageCheckRes) {
  return {
    dailyUsed: usage.used,
    dailyLimit: usage.limit,
    monthlyUsed: usage.used,
    monthlyLimit: usage.limit,
    period: usage.period,
    resetAt: usage.resetAt,
  };
}

function buildUserTurnContent(message: string, hasImage: boolean) {
  const content: Array<Record<string, unknown>> = [];

  if (message) {
    content.push({ type: "text", text: message });
  }

  if (hasImage) {
    content.push({ type: "image", note: "image_attached_not_persisted" });
  }

  return content.length > 0 ? content : [{ type: "text", text: "" }];
}

async function persistAssistantTurn(args: {
  memberId: string;
  roomId: string;
  message: string;
  hasImage: boolean;
  replyText: string;
}) {
  const bffSdkKey = process.env.BFF_SDK_KEY?.trim();
  if (!bffSdkKey) return;

  try {
    const saveResponse = await fetch(
      `${process.env.BASE_URL}/internal/ai/turns`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [BFF_SDK_KEY_HEADER]: bffSdkKey,
        },
        body: JSON.stringify({
          adminId: String(args.memberId),
          roomId: args.roomId,
          turns: [
            {
              role: "user",
              content: buildUserTurnContent(args.message, args.hasImage),
            },
            {
              role: "assistant",
              content: [{ type: "text", text: args.replyText }],
            },
          ],
        }),
        cache: "no-store",
      }
    );

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.error("AI turn 저장 실패:", errorText);
    }
  } catch (saveError) {
    console.error("AI turn 저장 실패:", saveError);
  }
}

export async function runAssistantAnalyze(
  input: RunAssistantAnalyzeInput
): Promise<RunAssistantAnalyzeResult> {
  const { token, memberId, message, roomId, image, onProgress, signal } = input;
  const hasImage = image instanceof File;

  if (!hasImage && !message) {
    throw new AssistantAnalyzeRequestError(
      400,
      "메시지 또는 이미지가 필요합니다."
    );
  }

  if (hasImage && image.size > ASSISTANT_MAX_IMAGE_SIZE_BYTES) {
    throw new AssistantAnalyzeRequestError(
      400,
      "이미지는 5MB 이하여야 합니다."
    );
  }

  const roomIdParsed = assistantRoomIdSchema.safeParse(roomId);
  if (!roomIdParsed.success) {
    throw new AssistantAnalyzeRequestError(400, "roomId가 필요합니다.");
  }

  const usage = await checkAiUsage(token);
  if (!usage.allowed) {
    throw new AssistantAnalyzeRequestError(
      429,
      "이번 달 AI 사용 한도에 도달했습니다."
    );
  }

  onProgress?.({ type: "status", message: "요청을 이해하고 있어요…" });

  const draftKey = { adminId: String(memberId), roomId: roomIdParsed.data };
  const currentDraft = getAssistantDraft(draftKey);
  const context = await getAiContext(token, { roomId: roomIdParsed.data });

  let aiCallsUsed = 0;
  let modelAnalysis: AssistantAnalysis;
  let prebuiltScheduleActions: AssistantAction[] | null = null;
  let scheduleBuildSucceeded = false;
  let datedScheduleBuildFailed = false;

  if (hasImage) {
    const imageDraftResult = await bootstrapAssistantImageDraft({
      token,
      message,
      image,
      draftKey,
      currentDraftHasQueue: Boolean(currentDraft?.queue.length),
      onProgress,
    });
    const { imageExtraction } = imageDraftResult;
    aiCallsUsed += imageDraftResult.aiCallsUsed;
    prebuiltScheduleActions = imageDraftResult.prebuiltScheduleActions;
    scheduleBuildSucceeded = imageDraftResult.scheduleBuildSucceeded;
    datedScheduleBuildFailed = imageDraftResult.datedScheduleBuildFailed;

    const draftBeforeText = getAssistantDraft(draftKey);
    const lockDraftForQueue =
      scheduleBuildSucceeded ||
      datedScheduleBuildFailed ||
      Boolean(
        draftBeforeText?.queue.some(
          (item) => item.type === "CREATE_RESERVATION"
        )
      );

    const textResult = await runAssistantTextAnalysis(token, {
      message,
      context,
      draft: draftBeforeText,
      imageExtraction,
      missingFields: evaluateAssistantDraft(draftBeforeText).missingFields,
      draftKey,
      lockDraftActions: lockDraftForQueue,
      onProgress,
      signal,
    });
    aiCallsUsed += textResult.aiCallsUsed;
    modelAnalysis = textResult.analysis;
    logAssistantDebug("text-analysis:result", modelAnalysis);

    if (
      !modelAnalysis.detected_text.trim() &&
      imageExtraction.detected_text.trim()
    ) {
      modelAnalysis = {
        ...modelAnalysis,
        detected_text: imageExtraction.detected_text,
      };
    }
  } else {
    const textResult = await runAssistantTextAnalysis(token, {
      message,
      context,
      draft: currentDraft,
      draftKey,
      onProgress,
      signal,
    });
    aiCallsUsed += textResult.aiCallsUsed;
    modelAnalysis = textResult.analysis;
  }

  logAssistantDebug("draft:before-final-merge", {
    incoming: modelAnalysis,
    existing: getAssistantDraft(draftKey),
    prebuiltScheduleActions,
  });

  let analysis: AssistantAnalysis;
  const draftAfterText = getAssistantDraft(draftKey);
  const lockDraftForQueue =
    scheduleBuildSucceeded ||
    datedScheduleBuildFailed ||
    Boolean(
      draftAfterText?.queue.some((item) => item.type === "CREATE_RESERVATION")
    );

  if (lockDraftForQueue) {
    let draftSnapshot = evaluateAssistantDraft(getAssistantDraft(draftKey));
    if (
      draftSnapshot.draft?.queue.some(
        (item) => item.type === "CREATE_RESERVATION"
      ) &&
      modelAnalysis.detected_text.trim()
    ) {
      draftSnapshot = await enrichAndPrefetchScheduleDraftQueue(
        draftKey,
        token,
        message,
        modelAnalysis.detected_text
      );
    }
    analysis = applyDraftSnapshotToAnalysis(modelAnalysis, draftSnapshot);
    logAssistantDebug("draft:after-schedule-build", draftSnapshot);
  } else {
    const draftSnapshot = await mergeAssistantAnalysisIntoDraftWithPrefetch(
      draftKey,
      modelAnalysis,
      token,
      message,
    );
    logAssistantDebug("draft:after-final-merge", draftSnapshot);
    analysis = applyDraftSnapshotToAnalysis(modelAnalysis, draftSnapshot);
  }

  logAssistantDebug("analysis:after-draft-apply", analysis);
  const analysisUsage = mapUsageToAnalysisUsage({
    ...usage,
    used: usage.used + aiCallsUsed,
  });

  await persistAssistantTurn({
    memberId,
    roomId: roomIdParsed.data,
    message,
    hasImage,
    replyText: analysis.summary,
  });

  return {
    analysis: {
      ...analysis,
      usage: analysisUsage,
    },
    roomId: roomIdParsed.data,
    aiCallsUsed,
    usage: analysisUsage,
  };
}

export function createAssistantAnalyzeNdjsonStream(
  input: RunAssistantAnalyzeInput
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (event: AssistantStreamEvent) => {
        controller.enqueue(encoder.encode(encodeAssistantStreamEvent(event)));
      };

      try {
        const result = await runAssistantAnalyze({
          ...input,
          onProgress: (event) => {
            if (event.type === "status") {
              enqueue({ type: "status", message: event.message });
              return;
            }

            enqueue({ type: "text", text: event.text });
          },
        });

        const summary = formatAssistantSummary(result.analysis);

        for await (const text of streamAssistantSummaryText(
          summary,
          input.signal
        )) {
          enqueue({ type: "text", text });
        }

        enqueue({
          type: "done",
          analysis: result.analysis,
          roomId: result.roomId,
          usage: result.usage,
        });
      } catch (error) {
        if (error instanceof AssistantAnalyzeRequestError) {
          enqueue({
            type: "error",
            message: error.message,
            status: error.status,
          });
          return;
        }

        console.error(error);
        enqueue({
          type: "error",
          message: "AI 분석 처리 중 오류가 발생했습니다.",
          status: 500,
        });
      } finally {
        controller.close();
      }
    },
  });
}

export async function parseAssistantAnalyzeFormData(
  formData: FormData
): Promise<{
  message: string;
  roomId: string;
  image: File | null;
}> {
  const message = String(formData.get("message") ?? "").trim();
  const image = formData.get("image");
  const roomId = String(formData.get("roomId") ?? "").trim();

  return {
    message,
    roomId,
    image: image instanceof File ? image : null,
  };
}
