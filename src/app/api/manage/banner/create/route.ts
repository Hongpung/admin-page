import { cookies } from "next/headers";
import type { BannerCreateDTO } from "@admin/features/banner/types";

function toStorageImagePath(rawUrl: string): string {
  const value = rawUrl.trim();
  const prefix = "https://s3.ap-northeast-2.amazonaws.com/";
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      // 쿠키가 존재하지 않으면 만료되었거나 삭제된 것으로 간주
      return new Response("Cookie has expired or does not exist", {
        status: 401,
      });
    }

    const data = (await req.json()) as BannerCreateDTO;

    const startDate = new Date(data.startDate);
    startDate.setHours(0);
    startDate.setMinutes(0);

    const endDate = new Date(data.endDate);
    endDate.setHours(0);
    endDate.setMinutes(0);

    const sendFormat = {
      ...data,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      bannerImgUrl: toStorageImagePath(data.bannerImgUrl),
    };

    const createResponse = await fetch(`${process.env.BASE_URL}/banner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sendFormat),
    });

    if (!createResponse.ok) {
      throw Error("Server Error");
    }

    const { bannerId } = await createResponse.json();

    return Response.json(
      { message: "Banner apply successful", bannerId },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}
