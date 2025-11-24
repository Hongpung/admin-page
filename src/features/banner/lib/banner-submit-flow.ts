import { createBanner, updateBanner, uploadImage } from "../api/banner-api";
import type { BannerCreateDTO, BannerDTO, BannerUpdateDTO } from "../types";

export type BannerCreateFormData = {
  owner: string;
  startDate: Date;
  endDate: Date;
  href?: string;
  bannerImg: File;
};

export type BannerUpdateFormData = {
  owner: string;
  startDate: Date;
  endDate: Date;
  href?: string;
  bannerImg: File | null;
};

export type BannerSubmitResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function runBannerCreateFlow(
  data: BannerCreateFormData
): Promise<BannerSubmitResult> {
  try {
    const imageFormData = new FormData();
    imageFormData.append(
      "image",
      data.bannerImg,
      `${data.owner}-${new Date().toISOString()}`
    );
    imageFormData.append("path", "banners");

    const imageURL = await uploadImage(imageFormData);

    const bannerData: BannerCreateDTO = {
      owner: data.owner,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      bannerImgUrl: imageURL,
    };
    if (data.href) bannerData.href = data.href;

    await createBanner({ bannerData });

    return { ok: true, message: "배너 생성에 성공했습니다." };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "처리 중 오류가 발생했습니다.";
    return { ok: false, message: msg };
  }
}

export async function runBannerUpdateFlow(
  data: BannerUpdateFormData,
  updatedPart: Record<string, boolean>,
  originBanner: BannerDTO
): Promise<BannerSubmitResult> {
  try {
    const bannerUpdateData: BannerUpdateDTO = {
      bannerId: originBanner.bannerId,
    };

    if (updatedPart.owner) bannerUpdateData.owner = data.owner;
    if (updatedPart.startDate) bannerUpdateData.startDate = data.startDate;
    if (updatedPart.endDate) bannerUpdateData.endDate = data.endDate;
    if (updatedPart["banner-href"]) bannerUpdateData.href = data.href;

    if (updatedPart["banner-image"] && data.bannerImg instanceof File) {
      const imageFormData = new FormData();
      imageFormData.append(
        "image",
        data.bannerImg,
        `${data.bannerImg.name}-${new Date().toISOString()}`
      );
      imageFormData.append("path", "banners");
      const imageURL = await uploadImage(imageFormData);
      bannerUpdateData.bannerImgUrl = imageURL;
    }

    await updateBanner({
      bannerUpdateData,
    });

    return { ok: true, message: "배너 수정에 성공했습니다." };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "처리 중 오류가 발생했습니다.";
    return { ok: false, message: msg };
  }
}
