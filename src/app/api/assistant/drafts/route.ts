import { cookies } from "next/headers";
import { BFF_SDK_KEY_HEADER } from "@admin/features/assistant/constants/bff-sdk";
import {
  createAiDraftReqSchema,
  createAiDraftResSchema,
} from "@admin/features/assistant/types/ai-api.types";
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

    const bffSdkKey = process.env.BFF_SDK_KEY?.trim();
    if (!bffSdkKey) {
      return Response.json(
        { message: "BFF SDK key가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    const body: unknown = await req.json();
    const parsed = createAiDraftReqSchema.safeParse({
      ...(typeof body === "object" && body !== null ? body : {}),
      adminId: String(memberId),
    });

    if (!parsed.success) {
      return new Response("요청 본문이 올바르지 않습니다.", { status: 400 });
    }

    const response = await fetch(`${process.env.BASE_URL}/internal/ai/drafts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [BFF_SDK_KEY_HEADER]: bffSdkKey,
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText || "AI draft 저장에 실패했습니다.", {
        status: response.status,
      });
    }

    const payload: unknown = await response.json();
    const draft = createAiDraftResSchema.safeParse(payload);
    if (!draft.success) {
      return new Response("메인 서버 응답 형식이 올바르지 않습니다.", {
        status: 500,
      });
    }

    return Response.json(draft.data, { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(
      error instanceof Error
        ? error.message
        : "AI draft 저장 중 오류가 발생했습니다.",
      { status: 500 },
    );
  }
}
