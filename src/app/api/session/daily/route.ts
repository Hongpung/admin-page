import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    const url = new URL(req.url);
    const date = url.searchParams.get("date");

    if (!date?.trim()) {
      return new Response("date is required (YYYY-MM-DD)", { status: 400 });
    }

    const requestURL = new URL(
      `${process.env.SUB_API}/admin/session-log/daily`
    );
    requestURL.searchParams.set("date", date);

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
