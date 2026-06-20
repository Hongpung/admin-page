import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { createAssistantRoomResSchema } from "@admin/features/assistant/types/ai-api.types";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return Response.json({ message: "인증이 필요합니다." }, { status: 401 });
    }

    return Response.json(
      createAssistantRoomResSchema.parse({ roomId: randomUUID() }),
    );
  } catch (error) {
    console.error(error);
    return new Response("AI 대화방 생성 중 오류가 발생했습니다.", {
      status: 500,
    });
  }
}
