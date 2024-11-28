'use server'
import { BannerDTO } from "./types";

export async function loadBanners() {
    try {
        console.log(`${process.env.SUB_API}/banners`)
        const response = await fetch(`${process.env.SUB_API}/banners`,{
            cache:'no-store'
        });

        if(!response.ok) throw Error('Server Error')
        const data = await response.json();
        console.log(data)

        return data||{AfterPost:[], OnPost:[], BeforePost:[]} as {AfterPost:BannerDTO[], OnPost:BannerDTO[], BeforePost:BannerDTO[]};
        
    } catch (e) {
        console.error(e);
        return null;
    }
}