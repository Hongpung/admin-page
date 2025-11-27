import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    const clubId = url.searchParams.get("clubId");
    const role = url.searchParams.get("role");

    const queryString = [];
    if (username && username.trim() !== "") {
      queryString.push(`username=${username}`);
    }

    if (clubId) {
      queryString.push(`clubId=${clubId}`);
    }

    if (role) {
      queryString.push(`role=${role}`);
    }

    const response = await fetch(
      `${process.env.BASE_URL}/member/search-user?${queryString.join("&")}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok)
      throw Error(
        "Response Error" + ` (${response.status}) :` + response.statusText
      );

    const authData = await response.json();

    return Response.json(authData);
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}
