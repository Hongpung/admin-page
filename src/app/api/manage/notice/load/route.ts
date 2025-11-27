import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return new Response("Error: Invalid Token", { status: 401 });

    const response = await fetch(`${process.env.BASE_URL}/notice`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok)
      throw Error(
        "Response Error" + ` (${response.status}) :` + response.statusText
      );

    const infos = await response.json();

    return Response.json(infos);
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}
