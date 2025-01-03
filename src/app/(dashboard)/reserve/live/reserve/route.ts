import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const url = new URL(req.url);
        const reservationId = url.searchParams.get('reservationId');

        console.log(`${process.env.SUB_API}/reservation/${reservationId}`)
        const response = await fetch(`${process.env.SUB_API}/reservation/${reservationId}`,
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

export async function DELETE(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const url = new URL(req.url);
        const reservationId = url.searchParams.get('reservationId');

        console.log(`${process.env.SUB_API}/reservation/admin/${reservationId}`)
        const response = await fetch(`${process.env.SUB_API}/reservation/admin/${reservationId}`,
            {
                method: 'DELETE',
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

export async function POST(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        
        const body = await req.json();

        console.log(`${process.env.SUB_API}/reservation/admin`, JSON.stringify(body))
        const response = await fetch(`${process.env.SUB_API}/reservation/admin`,
            {
                method: 'POST',
                headers: {
                    'Content-Type':'Application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        const data = await response.json();

        console.log(data)
        return Response.json(data);
    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}


export async function PATCH(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const body = await req.json();

        const url = new URL(req.url);
        const reservationId = url.searchParams.get('reservationId');

        console.log(`${process.env.SUB_API}/reservation/admin/${reservationId}`, JSON.stringify(body))
        const response = await fetch(`${process.env.SUB_API}/reservation/admin/${reservationId}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type':'Application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        const data = await response.json();

        console.log(data)
        return Response.json(data);
    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}