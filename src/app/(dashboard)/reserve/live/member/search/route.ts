import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const url = new URL(req.url);
        const username = url.searchParams.get('username'); 
        const clubId = url.searchParams.get('clubId'); 
        const role = url.searchParams.get('role'); 

        console.log({ username, clubId, role },'called')

        const queryString = []
        if (username && username.trim() !== '') {
            queryString.push(`username=${username}`);
        }

        if (clubId) {
            queryString.push(`clubId=${clubId}`);
        }

        if (role) {
            queryString.push(`role=${role}`);
        }

        console.log(`${process.env.SUB_API}/member/search-user?${queryString.map(string => string).join('&&')}`)
        const response = await fetch(`${process.env.SUB_API}/member/search-user?${queryString.map(string => string).join('&&')}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        const members = await response.json();

        return Response.json(members);
    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}