import { cookies } from "next/headers";



export async function POST(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const requestBody = await req.json();

        console.log(JSON.stringify(requestBody),`${process.env.BASE_URL}/reservation/manage`)

        const response = await fetch(`${process.env.BASE_URL}/reservation/manage`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type':'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        return Response.json({ message: 'Success to Batch Create' }, { status: 200 });

    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}