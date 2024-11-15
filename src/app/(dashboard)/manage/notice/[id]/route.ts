import { cookies } from "next/headers";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: number }> }
) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) return new Response('Error: Invalid Token', { status: 401 })

        const { id } = await params;
        console.log(params)

        const response = await fetch(`${process.env.BASE_URL}/info/${id}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        const infos = await response.json();

        return Response.json(infos);
    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}


export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: number }> }
) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) return new Response('Error: Invalid Token', { status: 401 })

        const body = await req.json();
        console.log(body)

        const { id } = await params;
        console.log(params)

        const response = await fetch(`${process.env.BASE_URL}/info/manage/${id}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        return new Response('Success', { status: 200 })

    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}


export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: number }> }
) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) return new Response('Error: Invalid Token', { status: 401 })
            
        const { id } = await params;
        console.log(params)

        const response = await fetch(`${process.env.BASE_URL}/info/manage/${id}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        return new Response('Success', { status: 200 })

    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}