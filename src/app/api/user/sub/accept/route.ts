import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    const response = await fetch(
      `${process.env.BASE_URL}/auth/admin/signup/sub`,
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

    const signUpData = await response.json();
    return Response.json(signUpData);
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}
