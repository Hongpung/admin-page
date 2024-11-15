import firestore from '@Firebase/firestore';
import { doc, getDoc } from "firebase/firestore";

export async function GET(req: Request) {
    try {

        const versionDoc = await getDoc(doc(firestore, "banners", "VERSION_KEY"));

        const versionData = versionDoc.data();

        if (versionData) {
            const { version } = versionData; // versionData의 version 속성에 접근
            return Response.json({ version: version.toDate() }); // 객체 형태로 반환하여 JSON으로 응답
        } else {
            throw Error("No version data found");
        }
    } catch (e) {
        console.error(e)
        return new Response('Error: ' + e, { status: 400 })
    }
}