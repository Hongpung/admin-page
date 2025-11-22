export interface BannerCreateDTO {
  owner: string;
  startDate: string;
  endDate: string;
  bannerImgUrl: string;
  href?: string;
}

export interface BannerDTO extends BannerCreateDTO {
  bannerId: string;
}

export interface BannerUpdateDTO {
  bannerId: string;
  owner?: string;
  startDate?: Date;
  endDate?: Date;
  bannerImgUrl?: string;
  href?: string;
}
