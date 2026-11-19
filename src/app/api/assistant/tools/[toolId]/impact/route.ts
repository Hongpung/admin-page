import { cookies } from "next/headers";
import { loadAssistantToolImpact } from "@admin/features/assistant/lib/load-assistant-tool-discard-impact";
import { getAssistantToolDefinition } from "@admin/features/assistant/lib/assistant-tool-definitions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const impactReqSchema = z.object({
  args: z.record(z.string(), z.unknown()),
});

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return Response.json({ message: "인증이 필요합니다." }, { status: 401 });
    }

    const { toolId } = await params;
    const definition = getAssistantToolDefinition(toolId);
    if (!definition) {
      return Response.json({ message: "알 수 없는 도구입니다." }, { status: 404 });
    }

    const body: unknown = await req.json();
    const parsed = impactReqSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: "요청 본문이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const discarded = await loadAssistantToolImpact(
      token,
      toolId,
      parsed.data.args,
    );

    return Response.json({
      discarded,
      totalCount: discarded.length,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "취소 예약 조회 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
