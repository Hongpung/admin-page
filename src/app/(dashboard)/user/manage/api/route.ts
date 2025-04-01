import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const url = new URL(req.url);
        const username = url.searchParams.get('username'); 
        const clubId = url.searchParams.get('clubId'); 
        const role = url.searchParams.get('role'); 
        const page = url.searchParams.get('page');

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

        if (page) {
            queryString.push(`page=${page}`);
        }else{
            queryString.push(`page=0`);
        }


        console.log(`${process.env.SUB_API}/member/search-user-page?${queryString.map(string => string).join('&')}`)
        const response = await fetch(`${process.env.SUB_API}/member/search-user-page?${queryString.map(string => string).join('&')}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        const authData = await response.json();

        console.log(authData)
        return Response.json(authData);
        
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
        console.log(JSON.stringify({ role , memberId}))

        const response = await fetch(`${process.env.BASE_URL}/member/roleAssignment/${memberId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
                ,
                body: JSON.stringify({ role })
            }
        )

        if (!response.ok) {
            const {message}= await response.json();
            throw Error('Response Error' + ` (${response.status}) :` + message)}

        return new Response('Success to Patch Role', { status: 200 });

    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}

export async function DELETE(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const { memberId }  = await req.json();

        const response = await fetch(`${process.env.BASE_URL}/auth/admin/${memberId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

        return new Response('Success to Patch Role', { status: 200 });

    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}