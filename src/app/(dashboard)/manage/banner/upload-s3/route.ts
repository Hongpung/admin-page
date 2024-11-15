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
        const file = formData.get('banner-image') as File;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer); 

        const fileName = `${file.name}.${file.type.split('/')[1]}`;

        // 2. AWS S3에 업로드하기
        const params = {
            Bucket: process.env.AWS_S3_BUCKET as string,
            Key: `banners/${file.name.split('-')[0]}/${fileName}`, // S3 내의 경로 요청자로 정리
            Body: buffer,  
            ContentType: file.type,
        };

        const uploadResult = await s3.upload(params).promise();

        return new Response(JSON.stringify({ imageURL: uploadResult.Location }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });


    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}