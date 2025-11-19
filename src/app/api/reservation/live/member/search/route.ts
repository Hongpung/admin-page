import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    const clubId = url.searchParams.get("clubId");
    const role = url.searchParams.get("role");
    const page = url.searchParams.get("page") ?? "0";
    const pageSize = url.searchParams.get("pageSize") ?? "20";

    const query = new URLSearchParams();
    if (username && username.trim() !== "") query.set("username", username);
    if (clubId) query.set("clubId", clubId);
    if (role) query.set("role", role);
    query.set("page", page);
    query.set("pageSize", pageSize);

    const response = await fetch(
      `${process.env.SUB_API}/member/search-user?${query.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok)
      throw Error(
        "Response Error" + ` (${response.status}) :` + response.statusText,
      );

    const body = await response.json();

    return Response.json(body);
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}
