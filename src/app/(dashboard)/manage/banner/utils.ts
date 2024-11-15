import { BannerCreateDTO, BannerDTO, BannerUpdateDTO } from "./types";

export async function createBanner({ bannerData }: { bannerData: BannerCreateDTO }) {
    try {
        const response = await fetch('/manage/banner/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(bannerData)
        })

        if (!response.ok) throw Error('Failed create banner')

        const { bannerId } = await response.json();

        return bannerId;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function uploadImage(formData: FormData) {

    try {
        const res = await fetch('/manage/banner/upload-s3', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) throw Error('Failed')
        const { imageURL } = await res.json();

        return imageURL;
    } catch (e) {
        console.error(e)
        return null;
    }

}

export async function deleteBanner(bannerId: string) {

    try {
        const res = await fetch(`/manage/banner/delete/${bannerId}`, {
            method: 'DELETE',
        });

        if (!res.ok) throw Error('Failed')

        return true;

    } catch (e) {
        console.error(e)
        throw Error('Failed to Delete');
    }
}

export async function updateBanner({ bannerUpdateData }: { bannerUpdateData: BannerUpdateDTO }) {

    try {
        const res = await fetch(`/manage/banner/update/${bannerUpdateData.id}`, {
            method: 'PUT',
            body: JSON.stringify(bannerUpdateData),
        });

        if (!res.ok) throw Error('Failed')
        const { bannerData } = await res.json();
        return bannerData;

    } catch (e) {
        console.error(e)
        throw Error('Failed to Delete')
    }

}



export async function loadOldBanners() {
    try {
        const res = await fetch(`/manage/banner/load?type=OLD`);

        if (!res.ok) throw Error();
        const { data } = await res.json();
        
        const parsedBanner = data.map((banners: any) => ({ ...banners, startDate: new Date(banners.startDate), endDate: new Date(banners.endDate) }))
        return parsedBanner as BannerDTO[];

    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function loadPlannedBanners() {
    try {
        const res = await fetch(`/manage/banner/load?type=PLANNED`);

        if (!res.ok) throw Error();

        const { data } = await res.json()

        const parsedBanner = data.map((banners: any) => ({ ...banners, startDate: new Date(banners.startDate), endDate: new Date(banners.endDate) }))
        return parsedBanner as BannerDTO[];

    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function loadActiveBanners() {
    try {
        const res = await fetch(`/manage/banner/load?type=ACTIVE`);

        if (!res.ok) throw Error();
        const { data } = await res.json();

        const parsedBanner = data.map((banners: any) => ({ ...banners, startDate: new Date(banners.startDate), endDate: new Date(banners.endDate) }))
        return parsedBanner as BannerDTO[];

    } catch (e) {
        console.error(e);
        return null;
    }
}