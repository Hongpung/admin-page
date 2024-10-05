import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const response = await fetch(`${process.env.BASE_URL}/member`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)
        const signUpData = await response.json();

        return Response.json(signUpData);
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
        const { role, memberId } = body;
        console.log(JSON.stringify({role}))

        const response = await fetch(`${process.env.BASE_URL}/member/manage/${memberId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
                ,
                body: JSON.stringify({role})
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        return new Response('Success to Patch Role',{status:200});

    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}