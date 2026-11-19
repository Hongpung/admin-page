import { cookies } from "next/headers";
import {
  AssistantAnalyzeRequestError,
  createAssistantAnalyzeNdjsonStream,
  parseAssistantAnalyzeFormData,
} from "@admin/features/assistant/lib/run-assistant-analyze";
import {
  decodeJwtPayload,
  pickMemberId,
} from "@admin/shared/lib/auth/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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

    const formData = await req.formData();
    const { message, roomId, image } = await parseAssistantAnalyzeFormData(
      formData,
    );

    const stream = createAssistantAnalyzeNdjsonStream({
      token,
      memberId: String(memberId),
      message,
      roomId,
      image,
      signal: req.signal,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof AssistantAnalyzeRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return new Response("AI 분석 처리 중 오류가 발생했습니다.", {
      status: 500,
    });
  }
}
