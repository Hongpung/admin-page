
export interface BannerCreateDTO {
    owner: string
    startDate: Date
    endDate: Date
    bannerImgUrl: string
    href?: string
}

export interface BannerDTO extends BannerCreateDTO {
    id: string
}

export interface BannerUpdateDTO {
    id: string
    owner?: string
    startDate?: Date
    endDate?: Date
    bannerImgUrl?: string
    href?: string
}