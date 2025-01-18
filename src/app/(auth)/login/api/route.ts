export async function POST(req: Request) {
    try {

        const { email, password } = await req.json();

        console.log(JSON.stringify({ email, password }))

        const response = await fetch(`${process.env.SUB_API}/auth/admin/login`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ email, password })
            }
        )

        if (!response.ok) {
            const { message } = await response.json();
            throw Error('Response Error from sever' + ` (${response.status}) :` + message)
        }

        const { token } = await response.json()

        return Response.json({ message: 'success' }, { headers: { 'Set-Cookie': `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600` } });
    } catch (e) {
        console.error(e)
        if (e instanceof Error)
            if (e.message == 'Is not Valid') return new Response(`Error :${e.message}`, { status: 403 })
        return new Response(`Error :${e}`, { status: 400 })
    }
}