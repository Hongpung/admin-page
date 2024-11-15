import { cookies } from "next/headers";
import firestore from '@Firebase/firestore';
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(req: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        const url = new URL(req.url);
        const type = url.searchParams.get('type');
        if (!token) {
            // 쿠키가 존재하지 않으면 만료되었거나 삭제된 것으로 간주
            return new Response('Cookie has expired or does not exist', { status: 401 });
        }

        const fbQuery = type == 'PLANNED' ?
            //예정된 배너
            query(
                collection(firestore, 'banners'),
                where('startDate', '>', new Date()),
            ) :
            type == 'OLD' ?
                //지난 배너
                query(
                    collection(firestore, 'banners'),
                    where('endDate', '<', new Date())
                ) :
                query(
                    collection(firestore, 'banners'),
                    where('startDate', '<=', new Date()),
                    where('endDate', '>=', new Date())
                )

        const docRef = await getDocs(fbQuery);

        const docsData = docRef.docs.map(doc => {
            const data = doc.data();

            if (data.startDate && data.startDate.toDate) {
                data.startDate = data.startDate.toDate(); // Timestamp -> Date
            }
            if (data.endDate && data.endDate.toDate) {
                data.endDate = data.endDate.toDate(); // Timestamp -> Date
            }

            return {
                id: doc.id,
                ...data
            };
        });


        return Response.json({ data: docsData }, { status: 200 });

    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}