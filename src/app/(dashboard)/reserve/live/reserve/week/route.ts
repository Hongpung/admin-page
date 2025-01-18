import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const url = new URL(req.url);

        const startDate = url.searchParams.get('start-date') || '2025-01-25';
        const endDate = url.searchParams.get('end-date') || '2025-01-29';

        console.log(`${process.env.SUB_API}/reservation/term?start-date=${startDate}&end-date=${endDate}`)

        const response = await fetch(`${process.env.SUB_API}/reservation/term?start-date=${startDate}&end-date=${endDate}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        const reserveDetailData = await response.json();

        return Response.json(reserveDetailData);
    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}