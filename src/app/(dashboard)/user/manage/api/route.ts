import { cookies } from "next/headers";
import { User } from "../../accept/utils";

export async function GET(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const response = await fetch(`${process.env.SUB_API}/auth/admin/auth-list`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )
        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)
        const authData = await response.json();

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
        console.log(JSON.stringify({ role }))

        const response = await fetch(`${process.env.SUB_API}/member/roleAssignment/${memberId}`,
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

        if (!response.ok) throw Error('Response Error' + ` (${response.status}) :` + response.statusText)

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

        const response = await fetch(`${process.env.BASE_URL}/member/manage/${memberId}`,
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