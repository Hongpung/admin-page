import { cookies } from "next/headers";
import {
  applyDraftSnapshotToAnalysis,
  completeAssistantDraftCurrentAction,
  failAssistantDraftCurrentAction,
} from "@admin/features/assistant/lib/assistant-draft";
import { clearAssistantDraft } from "@admin/features/assistant/lib/assistant-draft-store";
import { isDraftQueueComplete } from "@admin/features/assistant/lib/assistant-action-queue";
import { executeAssistantTool } from "@admin/features/assistant/lib/execute-assistant-tool";
import {
  getAssistantToolDefinition,
  validateAssistantToolArgs,
} from "@admin/features/assistant/lib/assistant-tool-definitions";
import { getAssistantActionLabel } from "@admin/features/assistant/lib/get-assistant-action-label";
import { executeAssistantToolReqSchema } from "@admin/features/assistant/types/assistant-tool.types";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";
import type { AssistantDraft } from "@admin/features/assistant/types/assistant-draft.types";
import {
  decodeJwtPayload,
  pickMemberId,
} from "@admin/shared/lib/auth/admin-auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function formatBatchActionDetail(payload: Record<string, unknown>): string | null {
  const option = isPlainRecord(payload.batchReservationOption)
    ? payload.batchReservationOption
    : {};
  const title = typeof option.title === "string" ? option.title : null;
  const dayTimes = Array.isArray(payload.dayTimes)
    ? payload.dayTimes
        .filter(isPlainRecord)
        .map((item) => {
          const day = typeof item.day === "string" ? item.day : null;
          const startTime =
            typeof item.startTime === "string" ? item.startTime : null;
          const endTime = typeof item.endTime === "string" ? item.endTime : null;
          return day && startTime && endTime
            ? `${day} ${startTime}~${endTime}`
            : null;
        })
        .filter((item) => item !== null)
    : [];
  const duration = isPlainRecord(payload.duration)
    ? payload.duration
    : {};
  const startDate =
    typeof duration.startDate === "string" ? duration.startDate : null;
  const endDate = typeof duration.endDate === "string" ? duration.endDate : null;

  return [
    title,
    dayTimes.length > 0 ? dayTimes.join(", ") : null,
    startDate && endDate ? `${startDate}~${endDate}` : null,
  ]
    .filter((item) => item && item.trim())
    .join(" / ") || null;
}

function formatActionDetail(item: AssistantDraft["queue"][number]): string {
  const label = getAssistantActionLabel(item.type);
  const payload = item.payload;

  if (item.type === "RESERVATION_BATCH_CREATE") {
    const detail = formatBatchActionDetail(payload);
    return detail ? `${label} - ${detail}` : label;
  }

  const title = typeof payload.title === "string" ? payload.title : null;
  const date = typeof payload.date === "string" ? payload.date : null;
  const time =
    typeof payload.startTime === "string" && typeof payload.endTime === "string"
      ? `${payload.startTime}~${payload.endTime}`
      : null;
  const noticeTitle = typeof payload.title === "string" ? payload.title : null;

  const detail = [title ?? noticeTitle, date, time]
    .filter((part) => part && part.trim())
    .join(" / ");

  return detail ? `${label} - ${detail}` : label;
}

function appendBriefingSection(
  lines: string[],
  title: string,
  items: AssistantDraft["queue"],
  emptyText: string,
) {
  lines.push("", title);
  if (items.length === 0) {
    lines.push(`- ${emptyText}`);
    return;
  }

  for (const item of items) {
    const error = item.error?.trim();
    lines.push(`- ${formatActionDetail(item)}${error ? ` (${error})` : ""}`);
  }
}

function isFailedQueueItem(item: AssistantDraft["queue"][number]): boolean {
  return (
    item.status === "failed" ||
    (item.status === "cancelled" && Boolean(item.error?.trim()))
  );
}

function buildExecutionBriefing(
  draft: AssistantDraft | null | undefined,
): string | null {
  const queue = draft?.queue ?? [];
  if (queue.length === 0) {
    return null;
  }

  const completed = queue.filter((item) => item.status === "completed");
  const failed = queue.filter(isFailedQueueItem);
  const cancelled = queue.filter(
    (item) => item.status === "cancelled" && !item.error?.trim(),
  );

  const lines = [
    `모든 작업이 끝났습니다. 성공 ${completed.length}건, 실패 ${failed.length}건${
      cancelled.length > 0 ? `, 취소 ${cancelled.length}건` : ""
    }입니다.`,
  ];

  appendBriefingSection(lines, "성공한 작업", completed, "없음");
  appendBriefingSection(lines, "실패한 작업", failed, "없음");
  if (cancelled.length > 0) {
    appendBriefingSection(lines, "취소된 작업", cancelled, "없음");
  }

  return lines.join("\n");
}

function withExecutionBriefing(
  analysis: AssistantAnalysis | undefined,
  briefing: string | null,
): AssistantAnalysis | undefined {
  if (!analysis || !briefing) return analysis;
  return {
    ...analysis,
    execution_briefing: briefing,
    admin_action_required: false,
    recommended_action: "",
    action: undefined,
  };
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return Response.json({ message: "인증이 필요합니다." }, { status: 401 });
    }

    const memberId = pickMemberId(decodeJwtPayload(token) ?? {});
    if (!memberId) {
      return Response.json(
        { message: "관리자 정보를 확인할 수 없습니다." },
        { status: 401 },
      );
    }

    const { toolId } = await params;
    const definition = getAssistantToolDefinition(toolId);
    if (!definition) {
      return Response.json({ message: "알 수 없는 도구입니다." }, { status: 404 });
    }

    const body: unknown = await req.json();
    const parsed = executeAssistantToolReqSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "요청 본문이 올바르지 않습니다.";
      return Response.json({ message }, { status: 400 });
    }

    const validatedArgs = validateAssistantToolArgs(definition.id, parsed.data.args);
    if (!validatedArgs.ok) {
      const draftKey = parsed.data.roomId
        ? {
            adminId: String(memberId),
            roomId: parsed.data.roomId,
          }
        : null;
      const result = { ok: false, message: validatedArgs.message };

      if (draftKey) {
        const snapshot = failAssistantDraftCurrentAction(
          draftKey,
          validatedArgs.message,
          parsed.data.actionId,
        );
        const analysis = parsed.data.analysis
          ? applyDraftSnapshotToAnalysis(parsed.data.analysis, snapshot)
          : undefined;

        return Response.json(
          {
            ...result,
            analysis,
            queueComplete: isDraftQueueComplete(snapshot.draft),
          },
          { status: 400 },
        );
      }

      return Response.json(result, { status: 400 });
    }

    const result = await executeAssistantTool(
      token,
      definition.id,
      validatedArgs.data,
    );

    const draftKey = parsed.data.roomId
      ? {
          adminId: String(memberId),
          roomId: parsed.data.roomId,
        }
      : null;

    if (!result.ok) {
      if (draftKey) {
        const snapshot = failAssistantDraftCurrentAction(
          draftKey,
          result.message,
          parsed.data.actionId,
        );
        const analysis = parsed.data.analysis
          ? applyDraftSnapshotToAnalysis(parsed.data.analysis, snapshot)
          : undefined;

        return Response.json(
          {
            ...result,
            analysis,
            queueComplete: isDraftQueueComplete(snapshot.draft),
          },
          { status: 400 },
        );
      }

      return Response.json({ message: result.message }, { status: 400 });
    }

    if (draftKey) {
      const snapshot = completeAssistantDraftCurrentAction(draftKey);
      const queueComplete = isDraftQueueComplete(snapshot.draft);
      const briefing = queueComplete
        ? buildExecutionBriefing(snapshot.draft) ?? result.message
        : null;

      if (queueComplete) {
        clearAssistantDraft(draftKey);
      }

      const analysis = parsed.data.analysis
        ? withExecutionBriefing(
            applyDraftSnapshotToAnalysis(parsed.data.analysis, snapshot),
            briefing,
          )
        : undefined;

      return Response.json({
        ...result,
        analysis,
        briefing,
        queueComplete,
        queueProgress: snapshot.queueProgress,
      });
    }

    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "도구 실행 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
