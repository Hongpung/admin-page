import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const id = Number(sessionId);
    if (!Number.isFinite(id)) {
      return new Response("invalid sessionId", { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const requestURL = new URL(
      `${process.env.BASE_URL}/session-log/specific/${id}`
    );

    const response = await fetch(requestURL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Response Error (${response.status}): ${response.statusText}`
      );
    }

    const body = await response.json();
    return Response.json(body);
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}
