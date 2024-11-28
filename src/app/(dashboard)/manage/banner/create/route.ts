import { cookies } from "next/headers";
import { BannerCreateDTO } from "../types";

export async function POST(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('utilToken')?.value;

        if (!token) {
            // 쿠키가 존재하지 않으면 만료되었거나 삭제된 것으로 간주
            return new Response('Cookie has expired or does not exist', { status: 401 });
        }

        const data = await req.json() as BannerCreateDTO;

        const startDate = new Date(data.startDate)
        startDate.setHours(0);
        startDate.setMinutes(0);

        const endDate = new Date(data.endDate)
        endDate.setHours(0);
        endDate.setMinutes(0);

        const sendFormat = {
            ...data,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };

        const createResponse = await fetch(`${process.env.SUB_API}/banners`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sendFormat)
        });


        if(!createResponse.ok) throw Error('Server Error');

        const {bannerId} = await createResponse.json();

        return Response.json({ message: 'Banner apply successful', bannerId }, { status: 201 });

    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}