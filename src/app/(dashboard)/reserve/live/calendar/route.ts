import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const url = new URL(req.url);
        const year = url.searchParams.get('year'); 
        const month = url.searchParams.get('month'); 

        console.log(`${process.env.SUB_API}/reservation/month-calendar?year=${year}&month=${month}`)
        const response = await fetch(`${process.env.SUB_API}/reservation/month-calendar?year=${year}&month=${month}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)
        
            
        const reserveData = await response.json();
        console.log(reserveData)
        
        return Response.json(reserveData);
    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}