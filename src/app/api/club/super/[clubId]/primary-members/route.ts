import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type RouteContext = { params: { clubId: string } };

type UpdateClubPrimaryMembersBody = {
  memberIds?: unknown;
};

function parseClubId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;

  const clubId = Number(raw);
  if (!Number.isSafeInteger(clubId) || clubId < 0) return null;

  return clubId;
}

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

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return Response.json({ message: "인증이 필요합니다." }, { status: 401 });
    }

    const clubId = parseClubId(params.clubId);
    if (clubId === null || clubId === undefined) {
      return Response.json(
        { message: "clubId가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.BASE_URL}/club/${clubId}/primary-members`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

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

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return Response.json({ message: "인증이 필요합니다." }, { status: 401 });
    }

    const clubId = parseClubId(params.clubId);
    if (clubId === null || clubId === undefined) {
      return Response.json(
        { message: "clubId가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const body = (await req.json()) as UpdateClubPrimaryMembersBody;
    const memberIds = normalizeMemberIds(body.memberIds);

    if (!memberIds) {
      return Response.json(
        { message: "memberIds는 1개 이상의 정수 배열이어야 합니다." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.BASE_URL}/club/${clubId}/primary-members`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberIds }),
      }
    );

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
