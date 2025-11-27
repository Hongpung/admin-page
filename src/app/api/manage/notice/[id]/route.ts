import { cookies } from "next/headers";
import type { Notice } from "@admin/features/notice";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: number }> }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return new Response("Error: Invalid Token", { status: 401 });

    const { id } = await params;

    const response = await fetch(`${process.env.BASE_URL}/notice/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok)
      throw Error(
        "Response Error" + ` (${response.status}) :` + response.statusText
      );

    const data = (await response.json()) as Notice;
    return Response.json(data);
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: number }> }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return new Response("Error: Invalid Token", { status: 401 });

    const body = await req.json();

    const { id } = await params;

    const response = await fetch(`${process.env.BASE_URL}/notice/${id}`, {
      method: "PATCH",
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: number }> }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return new Response("Error: Invalid Token", { status: 401 });

    const { id } = await params;

    const response = await fetch(`${process.env.BASE_URL}/notice/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
