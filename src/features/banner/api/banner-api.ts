import type { BannerCreateDTO, BannerDTO, BannerUpdateDTO } from "../types";
import { requestJson, requestVoid } from "@admin/shared/lib/http/api-fetch";

export async function createBanner({
  bannerData,
}: {
  bannerData: BannerCreateDTO;
}) {
  const { bannerId } = await requestJson<{ bannerId: string }>(
    "/api/manage/banner/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bannerData),
    },
  );

  return bannerId;
}

export async function uploadImage(formData: FormData) {
  const { imageURL } = await requestJson<{ imageURL: string }>("/api/upload-s3", {
    method: "POST",
    body: formData,
  });

  return imageURL;
}

export async function deleteBanner(bannerId: string) {
  await requestVoid(`/api/manage/banner/delete/${bannerId}`, {
    method: "DELETE",
  });
}

export async function updateBanner({
  bannerUpdateData,
}: {
  bannerUpdateData: BannerUpdateDTO;
}) {
  const { bannerData } = await requestJson<{ bannerData: BannerDTO }>(
    `/api/manage/banner/update/${bannerUpdateData.bannerId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bannerUpdateData),
    },
  );
  return bannerData;
}

export async function loadBanners() {
  const data = await requestJson<{
    AfterPost: BannerDTO[];
    OnPost: BannerDTO[];
    BeforePost: BannerDTO[];
  }>(`/api/manage/banner/load`);

  return data;
}
