import { cookies } from "next/headers";

export async function POST(req: Request) {
    const controller = new AbortController();
    const signal = controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            // 쿠키가 존재하지 않으면 만료되었거나 삭제된 것으로 간주
            return new Response('Cookie has expired or does not exist', { status: 401 });
        }

        const formData = await req.formData();
        const imageFile = formData.get('image') as File;

        const fileName = `${imageFile.name}.${imageFile.type.split('/')[1]}`;

        const uploadConfirm = await fetch(`${process.env.SUB_API}/upload-s3/image`,
            {
                method: 'POST',
                body: formData,
                signal
            })

        if (!uploadConfirm.ok) throw Error();

        const { uploadUrl, imageUrl } = await uploadConfirm.json();
        console.log(uploadUrl, imageUrl)

        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': imageFile.type,
            },
            body: imageFile,
            signal
        })

        if (!uploadResponse.ok) throw new Error('Failed to upload image to S3');

        return new Response(JSON.stringify({ imageURL: imageUrl }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });


    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}