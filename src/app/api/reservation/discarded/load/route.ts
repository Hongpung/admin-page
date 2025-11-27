import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    const url = new URL(req.url);
    const skip = url.searchParams.get("skip") ?? "0";
    const take = url.searchParams.get("take") ?? "20";

    const response = await fetch(
      `${process.env.BASE_URL}/admin/reservation/discarded?skip=${skip}&take=${take}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw Error(
        "Response Error" + ` (${response.status}) :` + response.statusText
      );
    }

    const data = (await response.json()) as {
      items?: unknown[];
      [key: string]: unknown;
    };

    const sanitizedItems = Array.isArray(data.items)
      ? data.items.map((item) => {
          if (!item || typeof item !== "object") return item;
          const rest = { ...(item as Record<string, unknown>) };
          delete rest.discardReasonDetail;
          return rest;
        })
      : data.items;

    return Response.json({
      ...data,
      items: sanitizedItems,
    });
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}
