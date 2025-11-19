import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    const requestBody = await req.json();

    const response = await fetch(`${process.env.SUB_API}/reservation/batch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok)
      throw Error(
        "Response Error" + ` (${response.status}) :` + response.statusText
      );

    return Response.json(
      { message: "Success to Batch Create" },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    const requestBody = await req.json();

    const response = await fetch(
      `${process.env.SUB_API}/admin/reservation/batch`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok)
      throw Error(
        "Response Error" + ` (${response.status}) :` + response.statusText
      );

    return Response.json(
      { message: "Success to Batch Create" },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}
