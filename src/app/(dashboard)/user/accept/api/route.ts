import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const response = await fetch(`${process.env.SUB_API}/auth/admin/signup`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        const signUpData = await response.json();
        console.log(signUpData)
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
        const { acceptedSignUpIds } = await body;

        console.log(acceptedSignUpIds)

        const response = await fetch(`${process.env.SUB_API}/auth/admin/signup/accept`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ acceptedSignUpIds })
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        return Response.json({ message: 'Accept Success' }, { status: 200 });

    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}