import { cookies } from "next/headers";

function toStorageImagePath(rawUrl: string): string {
  const value = rawUrl.trim();
  const prefix = "https://s3.ap-northeast-2.amazonaws.com/";
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bannerId: string }> }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      // 쿠키가 존재하지 않으면 만료되었거나 삭제된 것으로 간주
      return new Response("Cookie has expired or does not exist", {
        status: 401,
      });
    }

    const { bannerId } = await params;

    if (!bannerId) {
      // 쿠키가 존재하지 않으면 만료되었거나 삭제된 것으로 간주
      return new Response("BannerId does not exist", { status: 400 });
    }

    const data = await req.json(); // BannerUpdateDTO

    if (!!data.startDate) {
      const newStartDate = new Date(data.startDate);
      data.startDate = newStartDate.toISOString();
    }

    if (!!data.endDate) {
      const newEndDate = new Date(data.endDate);
      data.endDate = newEndDate.toISOString();
    }

    if (typeof data.bannerImgUrl === "string") {
      data.bannerImgUrl = toStorageImagePath(data.bannerImgUrl);
    }

    const response = await fetch(`${process.env.SUB_API}/banner/${bannerId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw Error("ServerError");
    }

    const updatedData = await response.json();

    return Response.json({
      message: "Banner delete successful",
      bannerData: updatedData,
    });
  } catch (e) {
    console.error(e);
    return new Response("Error: " + e, { status: 400 });
  }
}
