import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    const url = new URL(req.url);
    const reservationId = url.searchParams.get("reservationId");

    const response = await fetch(
      `${process.env.SUB_API}/reservation/${reservationId}`,
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

    const reserveDetailData = await response.json();

    return Response.json(reserveDetailData);
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    const url = new URL(req.url);
    const reservationId = url.searchParams.get("reservationId");

    const response = await fetch(
      `${process.env.SUB_API}/admin/reservation/${reservationId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok)
      throw Error(
        "Response Error" + ` (${response.status}) :` + response.statusText
      );

    const reserveDetailData = await response.json();

    return Response.json(reserveDetailData);
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    const body = await req.json();

    const response = await fetch(`${process.env.SUB_API}/admin/reservation`, {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(errorData);
      throw Error(
        "Response Error" + ` (${response.status}) :` + response.statusText
      );
    }

    const data = await response.json();

    return Response.json(data);
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    const body = await req.json();

    const url = new URL(req.url);
    const reservationId = url.searchParams.get("reservationId");

    const response = await fetch(
      `${process.env.SUB_API}/admin/reservation/${reservationId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "Application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok)
      throw Error(
        "Response Error" + ` (${response.status}) :` + response.statusText
      );

    const data = await response.json();

    return Response.json(data);
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}
