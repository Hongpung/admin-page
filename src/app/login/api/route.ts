'use server'

export async function POST(req: Request) {
    try {

        const { email, password } = await req.json();

        const response = await fetch(`${process.env.BASE_URL}/auth/login`,
            {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ email, password })
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        const loginData = await response.json()
        const { token } = loginData;

        return Response.json(loginData, { headers: { 'Set-Cookie': `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=36000` } });
    } catch (e) {
        console.error(e)
        return new Response(`Error :${e}`, { status: 400 })
    }
}