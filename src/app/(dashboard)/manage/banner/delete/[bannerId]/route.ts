import { cookies } from "next/headers";
import firestore from '@Firebase/firestore';
import { deleteDoc, doc, updateDoc } from "firebase/firestore";

export async function DELETE(req: Request, { params }: { params: Promise<{ bannerId: string }> }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            // 쿠키가 존재하지 않으면 만료되었거나 삭제된 것으로 간주
            return new Response('Cookie has expired or does not exist', { status: 401 });
        }

        const { bannerId } = await params;

        if (!bannerId) {
            // 쿠키가 존재하지 않으면 만료되었거나 삭제된 것으로 간주
            return new Response('BannerId does not exist', { status: 400 });
        }

        await deleteDoc(doc(firestore, "banners", bannerId));
        
        await updateDoc(doc(firestore, "banners", 'VERSION_KEY'), {
            version: new Date()
         });
        return Response.json({ message: 'Banner delete successful' });

    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}
