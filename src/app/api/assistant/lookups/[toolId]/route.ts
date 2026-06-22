import { cookies } from "next/headers";
import { getAssistantLookupToolDefinition } from "@admin/features/assistant/lib/assistant-lookup-tool-definitions";
import { executeAssistantLookupTool } from "@admin/features/assistant/lib/execute-assistant-lookup-tool";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return Response.json({ message: "인증이 필요합니다." }, { status: 401 });
    }

    const { toolId } = await params;
    const definition = getAssistantLookupToolDefinition(toolId);
    if (!definition) {
      return Response.json({ message: "알 수 없는 조회 도구입니다." }, { status: 404 });
    }

    const url = new URL(req.url);
    const clubName = url.searchParams.get("clubName")?.trim();
    const date = url.searchParams.get("date")?.trim();
    const startDate = url.searchParams.get("startDate")?.trim();
    const endDate = url.searchParams.get("endDate")?.trim();
    const weekOffsetRaw = url.searchParams.get("weekOffset");
    const username = url.searchParams.get("username")?.trim();
    const clubIdRaw = url.searchParams.get("clubId");
    const role = url.searchParams.get("role")?.trim();
    const pageRaw = url.searchParams.get("page");
    const pageSizeRaw = url.searchParams.get("pageSize");

    const args: Record<string, unknown> = {};
    if (clubName) args.clubName = clubName;
    if (date) args.date = date;
    if (startDate) args.startDate = startDate;
    if (endDate) args.endDate = endDate;
    if (weekOffsetRaw !== null && weekOffsetRaw !== "") {
      args.weekOffset = Number(weekOffsetRaw);
    }
    if (username) args.username = username;
    if (clubIdRaw !== null && clubIdRaw !== "") {
      args.clubId = Number(clubIdRaw);
    }
    if (role) args.role = role;
    if (pageRaw !== null && pageRaw !== "") {
      args.page = Number(pageRaw);
    }
    if (pageSizeRaw !== null && pageSizeRaw !== "") {
      args.pageSize = Number(pageSizeRaw);
    }

    const result = await executeAssistantLookupTool(token, toolId, args);
    if (!result.ok) {
      return Response.json({ message: result.message }, { status: 400 });
    }

    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "조회 도구 실행 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
