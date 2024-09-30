import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;
        
        const response = await fetch(`${process.env.BASE_URL}/auth/signup`,
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

export async function POST(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const body = await req.json();
        const { signupId, acceptResult } = body;

        console.log(JSON.stringify({ acceptResult }))
        console.log(`${process.env.BASE_URL}/auth/signup/${signupId}`)


        const response = await fetch(`${process.env.BASE_URL}/auth/signup/${signupId}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ acceptResult })
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        return new Response('Accept Success', { status: 200 });
        
    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}