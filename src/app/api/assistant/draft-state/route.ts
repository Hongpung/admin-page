import { cookies } from "next/headers";
import {
  applyDraftSnapshotToAnalysis,
  cancelAssistantDraftCurrentAction,
  patchAssistantDraftAndResolve,
  retryAssistantDraftCurrentAction,
} from "@admin/features/assistant/lib/assistant-draft";
import { clearAssistantDraft } from "@admin/features/assistant/lib/assistant-draft-store";
import { resolveCreatorFieldsInPatch } from "@admin/features/assistant/lib/resolve-creator-fields-on-patch";
import { assistantAnalysisSchema } from "@admin/features/assistant/types/assistant-analysis.types";
import { assistantRoomIdSchema } from "@admin/features/assistant/types/ai-api.types";
import {
  decodeJwtPayload,
  pickMemberId,
} from "@admin/shared/lib/auth/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchDraftBodySchema = z.object({
  roomId: assistantRoomIdSchema,
  patch: z.record(z.string(), z.unknown()).optional(),
  analysis: assistantAnalysisSchema.optional(),
  actionId: z.string().optional(),
  cancelCurrent: z.boolean().optional(),
  retryCurrent: z.boolean().optional(),
  userMessage: z.string().optional(),
});

export async function PATCH(req: Request) {
  try {
    const cookieStore = cookies();
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

    const body: unknown = await req.json();
    const parsed = patchDraftBodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: "요청 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const draftKey = {
      adminId: String(memberId),
      roomId: parsed.data.roomId,
    };

    if (parsed.data.cancelCurrent) {
      const snapshot = cancelAssistantDraftCurrentAction(draftKey);
      const baseAnalysis =
        parsed.data.analysis ??
        ({
          summary: "",
          detected_text: "",
          admin_action_required: false,
          recommended_action: "",
          confidence: 1,
          fallback_required: false,
        } satisfies z.infer<typeof assistantAnalysisSchema>);

      const analysis = applyDraftSnapshotToAnalysis(baseAnalysis, snapshot);

      return Response.json({
        ok: true,
        snapshot: {
          ready: snapshot.ready,
          missingFields: snapshot.missingFields,
          missingFieldItems: snapshot.missingFieldItems,
          queueProgress: snapshot.queueProgress,
        },
        analysis,
      });
    }

    if (parsed.data.retryCurrent) {
      const snapshot = retryAssistantDraftCurrentAction(
        draftKey,
        parsed.data.actionId,
      );
      const baseAnalysis =
        parsed.data.analysis ??
        ({
          summary: "",
          detected_text: "",
          admin_action_required: true,
          recommended_action: "",
          confidence: 1,
          fallback_required: false,
        } satisfies z.infer<typeof assistantAnalysisSchema>);

      const analysis = applyDraftSnapshotToAnalysis(baseAnalysis, snapshot);

      return Response.json({
        ok: true,
        snapshot: {
          ready: snapshot.ready,
          missingFields: snapshot.missingFields,
          missingFieldItems: snapshot.missingFieldItems,
          queueProgress: snapshot.queueProgress,
        },
        analysis,
      });
    }

    if (!parsed.data.patch) {
      return Response.json(
        { message: "patch, cancelCurrent, retryCurrent 중 하나가 필요합니다." },
        { status: 400 },
      );
    }

    const resolvedPatch = await resolveCreatorFieldsInPatch(
      token,
      parsed.data.patch,
    );
    const analysisForRestore = parsed.data.analysis;
    const userMessage =
      parsed.data.userMessage?.trim() ||
      analysisForRestore?.summary?.trim() ||
      "";
    const detectedText = analysisForRestore?.detected_text?.trim() || "";

    const { snapshot } = await patchAssistantDraftAndResolve({
      key: draftKey,
      patch: resolvedPatch,
      actionId: parsed.data.actionId,
      analysis: analysisForRestore,
      token,
      userMessage,
      detectedText,
    });

    if (!snapshot.currentAction) {
      return Response.json(
        { message: "진행 중인 작업이 없습니다. 요청을 다시 보내주세요." },
        { status: 404 },
      );
    }

    const baseAnalysis =
      analysisForRestore ??
      ({
        summary: "",
        detected_text: "",
        admin_action_required: true,
        recommended_action: "",
        confidence: 1,
        fallback_required: false,
        action: snapshot.currentAction
          ? {
              id: snapshot.currentAction.id,
              type: snapshot.currentAction.type,
              payload: snapshot.currentAction.payload,
            }
          : undefined,
        actions: snapshot.draft?.queue.map((item) => ({
          id: item.id,
          type: item.type,
          payload: item.payload,
        })),
      } satisfies z.infer<typeof assistantAnalysisSchema>);

    const analysis = applyDraftSnapshotToAnalysis(baseAnalysis, snapshot);

    return Response.json({
      ok: true,
      snapshot: {
        ready: snapshot.ready,
        missingFields: snapshot.missingFields,
        missingFieldItems: snapshot.missingFieldItems,
        queueProgress: snapshot.queueProgress,
      },
      analysis,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "draft 업데이트 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = cookies();
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

    const body: unknown = await req.json();
    const roomIdParsed = assistantRoomIdSchema.safeParse(
      typeof body === "object" && body !== null
        ? (body as { roomId?: unknown }).roomId
        : undefined,
    );

    if (!roomIdParsed.success) {
      return Response.json({ message: "roomId가 필요합니다." }, { status: 400 });
    }

    clearAssistantDraft({
      adminId: String(memberId),
      roomId: roomIdParsed.data,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "AI draft 초기화 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
