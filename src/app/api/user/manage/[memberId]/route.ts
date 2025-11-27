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

    const body = await req.json();
    const response = await fetch(
      `${process.env.BASE_URL}/member/admin/${params.memberId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ message: String(error) }, { status: 400 });
  }
}
