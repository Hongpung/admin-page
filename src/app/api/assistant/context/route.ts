import { cookies } from "next/headers";
import { getAiContext } from "@admin/features/assistant/lib/ai-main-server";
import { assistantRoomIdSchema } from "@admin/features/assistant/types/ai-api.types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return Response.json({ message: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 20;
    const roomIdParsed = assistantRoomIdSchema.safeParse(
      searchParams.get("roomId")?.trim(),
    );

    if (!roomIdParsed.success) {
      return new Response("roomId가 필요합니다.", { status: 400 });
    }

    const context = await getAiContext(token, {
      limit: Number.isFinite(limit) ? limit : 20,
      roomId: roomIdParsed.data,
    });

    return Response.json(context);
  } catch (error) {
    console.error(error);
    return new Response(
      error instanceof Error
        ? error.message
        : "AI 컨텍스트 조회 중 오류가 발생했습니다.",
      { status: 500 },
    );
  }
}
