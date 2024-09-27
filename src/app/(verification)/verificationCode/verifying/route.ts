import firestore from '@Firebase/firestore';
import { deleteDoc, doc, getDoc } from "firebase/firestore";

const CODE_EXPIRATION_TIME = 5 * 60 * 1000; // 5분을 밀리초로 환산

export async function POST(req: Request) {

    const { email, code } = await req.json();

    console.log(email,code)
    if (!email || !code) {
        return Response.json({ error: 'Email and code are required' },{status:400});
      }

    const verificationDocRef = doc(firestore, 'verified_logs', email);
    const verificationDocSnap = await getDoc(verificationDocRef);

    if (!verificationDocSnap.exists()) {
        return Response.json({ error: 'No verification codes found for this email' }, { status: 404 });
    }
    const { codes } = verificationDocSnap.data();

    const lastCode = codes[codes.length - 1];
    const { timestamp } = verificationDocSnap.data();

    const codeTimestamp = new Date(timestamp);
    const currentTime = new Date();
    console.log(lastCode == code)
    
    if (lastCode != code) {
        return Response.json({ error: 'Invalid verification code' }, { status: 405 });
    }

    const timeDifference = currentTime.getTime() - codeTimestamp.getTime();

    if (timeDifference > CODE_EXPIRATION_TIME) {
        return Response.json({ error: 'Verification code has expired' }, { status: 403 });
    }

    await deleteDoc(verificationDocRef);

    return Response.json({ message: 'Verification successful' });
}

