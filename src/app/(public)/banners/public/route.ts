import firestore from '@Firebase/firestore';
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(req: Request) {
    try {

        const fbQuery =
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


        return Response.json(docsData);

    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}