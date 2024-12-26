import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const url = new URL(req.url);
        const date = url.searchParams.get('date'); 

        console.log(`${process.env.SUB_API}/reservation/daily?date=${date}`)
        const response = await fetch(`${process.env.SUB_API}/reservation/daily?date=${date}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        const reserveData = await response.json();

        return Response.json(reserveData);
    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}