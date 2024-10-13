import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const url = new URL(req.url);
        const reservationId = url.searchParams.get('reservationId'); 

        console.log(`${process.env.BASE_URL}/reservation/${reservationId}`)
        const response = await fetch(`${process.env.BASE_URL}/reservation/${reservationId}`,
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

        console.log(`${process.env.BASE_URL}/reservation/manage/${reservationId}`)
        const response = await fetch(`${process.env.BASE_URL}/reservation/manage/${reservationId}`,
            {
                method:'DELETE',
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