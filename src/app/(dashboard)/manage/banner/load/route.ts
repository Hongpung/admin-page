import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('utilToken')?.value;

        if (!token) {
            return new Response('Cookie has expired or does not exist', { status: 401 });
        }

        const response = await fetch(`${process.env.SUB_API}/banners/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json()
        console.log(data)
        return Response.json(data, { status: 200 });

    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}