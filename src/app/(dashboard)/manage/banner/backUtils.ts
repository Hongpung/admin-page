'use server'
import { BannerDTO } from "./types";
import { cookies } from 'next/headers';

export async function loadBanners() {
    try {

        const cookieStore = cookies();
        const token = cookieStore.get('utilToken')?.value;
        
        if (!token) {
            // 쿠키가 존재하지 않으면 만료되었거나 삭제된 것으로 간주
            return new Response('Cookie has expired or does not exist', { status: 401 });
        }

        console.log(`${process.env.SUB_API}/banners`)
        const response = await fetch(`${process.env.SUB_API}/banners`, {
            cache: 'no-store',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw Error('Server Error')
        const data = await response.json();
        console.log(data)

        return data || { AfterPost: [], OnPost: [], BeforePost: [] } as { AfterPost: BannerDTO[], OnPost: BannerDTO[], BeforePost: BannerDTO[] };

    } catch (e) {
        console.error(e);
        return null;
    }
}