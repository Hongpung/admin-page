import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    const url = new URL(req.url);
    const skip = url.searchParams.get("skip");

    const requestURL = new URL(
      `${process.env.BASE_URL}/admin/session-log/list`
    );
    if (skip) requestURL.searchParams.set("skip", skip);

    const response = await fetch(requestURL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok)
      throw Error(
        "Response Error" + ` (${response.status}) :` + response.statusText
      );

    const sesssionList = await response.json();

    return Response.json(sesssionList);
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}
