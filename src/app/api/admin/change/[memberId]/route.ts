import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type RouteContext = { params: { memberId: string } };

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return Response.json({ message: "인증이 필요합니다." }, { status: 401 });
    }

    const memberId = params.memberId;
    const body = await req.json();

    const response = await fetch(
      `${process.env.BASE_URL}/admin/change/${memberId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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
