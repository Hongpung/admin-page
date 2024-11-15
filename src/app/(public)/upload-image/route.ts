import { cookies } from "next/headers";
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

export async function POST(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            // 쿠키가 존재하지 않으면 만료되었거나 삭제된 것으로 간주
            return new Response('Cookie has expired or does not exist', { status: 401 });
        }

        const formData = await req.formData();

        const file = formData.get('image') as File;
        const path = formData.get('path') as string;

        const fileName = `${file.name}.${file.type.split('/')[1]}`;

        console.log(fileName)
        // 2. AWS S3에 업로드하기
        const params = {
            Bucket: process.env.AWS_S3_BUCKET as string,
            Key: `${path}/${file.name.split('-')[0]}/${fileName}`, // S3 내의 경로 요청자로 정리
            Expires: 60,
            ContentType: file.type,
        };

        const signedUrl = await s3.getSignedUrlPromise('putObject', params);
        const imageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${path}/${file.name.split('-')[0]}/${fileName}`;

        return new Response(JSON.stringify({ uploadUrl: signedUrl, imageUrl }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });


    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}