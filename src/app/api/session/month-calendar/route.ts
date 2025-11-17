import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    const url = new URL(req.url);
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");

    if (!year || !month) {
      return new Response("year and month are required", { status: 400 });
    }

    const requestURL = new URL(
      `${process.env.SUB_API}/admin/session-log/month-calendar`
    );
    requestURL.searchParams.set("year", year);
    requestURL.searchParams.set("month", month);

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
