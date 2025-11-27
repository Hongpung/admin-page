import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const SUB_PRIMARY_MEMBERS_PATH = `${process.env.BASE_URL}/club/sub/primary-members`;

type UpdateClubPrimaryMembersBody = {
  memberIds?: unknown;
};

function normalizeMemberIds(memberIds: unknown): number[] | null {
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return null;
  }

  const normalized = memberIds.map((value) => Number(value));
  if (normalized.some((value) => !Number.isInteger(value) || value <= 0)) {
    return null;
  }

  return normalized;
}

/** SUB 관리자: 토큰의 동아리 기준 주요 활동 멤버 조회 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return Response.json({ message: "인증이 필요합니다." }, { status: 401 });
    }

    const response = await fetch(SUB_PRIMARY_MEMBERS_PATH, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const text = await response.text();

    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ message: String(e) }, { status: 400 });
  }
}

/** SUB 관리자: 토큰의 동아리 기준 주요 활동 멤버 업데이트 */
export async function PATCH(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return Response.json({ message: "인증이 필요합니다." }, { status: 401 });
    }

    const body = (await req.json()) as UpdateClubPrimaryMembersBody;
    const memberIds = normalizeMemberIds(body.memberIds);

    if (!memberIds) {
      return Response.json(
        { message: "memberIds는 1개 이상의 정수 배열이어야 합니다." },
        { status: 400 }
      );
    }

    const response = await fetch(SUB_PRIMARY_MEMBERS_PATH, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ memberIds }),
    });

    const text = await response.text();

    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ message: String(e) }, { status: 400 });
  }
}
