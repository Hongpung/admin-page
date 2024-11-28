'use server'

export async function POST(req: Request) {
    try {

        const { email, password } = await req.json();

        console.log(JSON.stringify({ email, password }))

        const response = await fetch(`${process.env.SUB_API}/auth/login`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ email, password })
            }
        )

        if (!response.ok) throw Error('Response Error from sever' + ` (${response.status}) :` + response.statusText)

        const loginData = await response.json()

        const { token, utilToken } = await loginData;

        const checkAdmin = await fetch(`${process.env.BASE_URL}/member/status`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            }
        )

        if (!checkAdmin.ok) throw Error('Response Error from sever' + ` (${checkAdmin.status}) :` + checkAdmin.statusText)

        const { role } = await checkAdmin.json();

        if (role != '홍풍의장') throw Error('Is not Valid')

        const clientResponse = Response.json({ message: 'success' });
        clientResponse.headers.append('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=72000`)
        clientResponse.headers.append('Set-Cookie', `utilToken=${utilToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=72000`)
        clientResponse.headers.append('Content-Type', 'application/json')
        return clientResponse;
    } catch (e) {
        console.error(e)
        if (e instanceof Error)
            if (e.message == 'Is not Valid') return new Response(`Error :${e.message}`, { status: 403 })
        return new Response(`Error :${e}`, { status: 400 })
    }
}