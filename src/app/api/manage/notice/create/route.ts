import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return new Response("Error: Invalid Token", { status: 401 });

    const body = await req.json();

    const response = await fetch(`${process.env.BASE_URL}/notice`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok)
      throw Error(
        "Response Error" + ` (${response.status}) :` + response.statusText
      );

    return new Response("Success", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}
