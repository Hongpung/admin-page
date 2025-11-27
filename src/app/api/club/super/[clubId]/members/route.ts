import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type RouteContext = { params: { clubId: string } };

function parseClubId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;

  const clubId = Number(raw);
  if (!Number.isSafeInteger(clubId) || clubId < 0) return null;

  return clubId;
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
      `${process.env.BASE_URL}/club/${clubId}/members`,
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
