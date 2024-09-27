import firestore from '@Firebase/firestore';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import nodemailer from 'nodemailer';

export async function POST(req: Request) {

    const { email } = await req.json();

    // 인증 코드 생성 (랜덤 6자리 숫자)
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    const verificationDocRef = doc(firestore, 'verified_logs', email);

    let currentCodes = [];

    if ((await getDoc(verificationDocRef)).exists()) {
        currentCodes = (await getDoc(verificationDocRef)).data()?.codes;
    }

    if (currentCodes.length >= 5) {
        return Response.json({ error: 'Maximum verification attempts reached' }, { status: 403 });
    }

    if ((await getDoc(verificationDocRef)).exists()) {
        await updateDoc(verificationDocRef, {
            codes: arrayUnion(verificationCode), 
            timestamp: serverTimestamp(), 
        });
    } else {
        await setDoc(verificationDocRef, {
            email,
            codes: [verificationCode],
            timestamp: serverTimestamp(),
        });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PW,
        },
    });

    const mailOptions = {
        from: `"홍풍" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: '홍풍:이메일 인증번호 전송',
        html:`<html>
        <body style="display: flex;justify-content: center; height:420px">
        <div
          style="display: flex; width:500px; flex-direction: column; align-items: center; border-radius:5px; border: 1px solid #001329;">
          <div
            style="display: flex; flex-direction: column; background-color: #001329; width: 100%; color: white; text-align:center; border-radius:5px; align-items: center; justify-content: space-between;">
            <div style="margin-top: 40px;"> 홍익대학교 풍물연습실 예약 시스템</div>
            <h1 style="margin-bottom: 40px;">회원 가입 인증번호</h1>
          </div>
          <div style="height: 160px; display: flex; align-items: center;">
            <div
              style="border-radius:10px; display: flex; background-color: #e7f2ff;width: 140px; height: 60px;align-items: center;font-size: 30px; justify-content: center; font-weight: 600;color: #002957; ">
              ${verificationCode}</div>
          </div>
          <footer
            style="display: flex; flex-direction: column; height: 120px;background-color: black; width: 100%; justify-content: end; ">
            <div style="color: #e7f2ff; margin: 2px 10px; ">문의 이메일: b811005@g.hongik.ac.kr</div>
            <div style="color: #e7f2ff;margin: 2px 10px; ">개발자: 강윤호(산틀 18), 이창근(산틀 19)</div>
          </footer>
        </div>
      </body>
      </html>`
    };

    try {
        await transporter.sendMail(mailOptions);

        return new Response(JSON.stringify({ message: 'Verification code sent' }), { status: 200 });

    } catch (error) {
        console.error('Error sending email:', error);
        return new Response('Error sending email', { status: 500 });
    }
}

