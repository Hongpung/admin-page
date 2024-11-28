
import { cookies } from "next/headers";

export async function PATCH(req: Request, { params }: { params: Promise<{ bannerId: string }> }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('utilToken')?.value;

        if (!token) {
            // 쿠키가 존재하지 않으면 만료되었거나 삭제된 것으로 간주
            return new Response('Cookie has expired or does not exist', { status: 401 });
        }

        const { bannerId } = await params;

        if (!bannerId) {
            // 쿠키가 존재하지 않으면 만료되었거나 삭제된 것으로 간주
            return new Response('BannerId does not exist', { status: 400 });
        }

        const data = await req.json() // BannerUpdateDTO

        if (!!data.startDate) {
            const newStartDate = new Date(data.startDate)
            newStartDate.setHours(0);
            newStartDate.setMinutes(0);
            data.startDate = newStartDate
        }

        if (!!data.endDate) {
            const newEndDate = new Date(data.endDate)
            newEndDate.setHours(0);
            newEndDate.setMinutes(0);
            data.endDate = newEndDate
        }

        const response = await fetch(`${process.env.SUB_API}/banners/${bannerId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if(!response.ok) throw Error('ServerError')
            
        const updatedData = await response.json() ;

        return Response.json({ message: 'Banner delete successful', bannerData: updatedData });

    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}