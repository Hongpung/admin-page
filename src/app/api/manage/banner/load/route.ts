import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return new Response("Cookie has expired or does not exist", {
        status: 401,
      });
    }

    const response = await fetch(`${process.env.BASE_URL}/banner`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return Response.json(data, { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}
