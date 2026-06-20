import { cookies } from "next/headers";
import { checkAiUsage } from "@admin/features/assistant/lib/ai-main-server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return Response.json({ message: "인증이 필요합니다." }, { status: 401 });
    }

    const usage = await checkAiUsage(token);
    return Response.json(usage);
  } catch (error) {
    console.error(error);
    return new Response(
      error instanceof Error
        ? error.message
        : "AI 사용량 확인 중 오류가 발생했습니다.",
      { status: 500 },
    );
  }
}
