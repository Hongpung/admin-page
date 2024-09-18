"use client"
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

async function tryLogin(email: string, password: string) {
    try {
        const response = await fetch("http://localhost:3000/login", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok' + response.statusText);
        }

        const data = await response.json();
        console.log('Login successful:', data);

        const cookieResponse = await fetch("http://localhost:3000/check-cookie", {
            method: 'GET',
            credentials: 'include'
        });

        if (!cookieResponse.ok) {
            throw new Error(`Network response was not ok: ${cookieResponse.statusText} (status: ${cookieResponse.status})`);
        }

        const cookieData = await cookieResponse.json();
        console.log('Cookie data:', cookieData);

        return data;
    } catch (error) {
        console.error('There was a problem with the Login request:', error);
        throw error;
    }
}

export function LoginForm() {
    const router = useRouter();
    const [isValid, setValid] = useState(true);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        setValid(false)
        console.log({ email, password });

        router.replace("/dashboard");
    };

    return (
        <>
            <form className="flex flex-col font-[family-name:var(--font-geist-mono)]"
                onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4">
                    <input type="email" placeholder="id를 입력하세요" name="email"
                        required
                        className={"border-gray-200 border-solid border rounded-md outline-blue-500 outline-1 py-1 px-2 placeholder:text-gray-400 " + `${!isValid ? "border-red-500" : ""}`}
                    />
                    <input type="password" placeholder="비밀번호를 입력하세요" name="password"
                        required
                        className={"border-gray-200 border-solid border rounded-md outline-blue-500 outline-1 py-1 px-2 placeholder:text-gray-400 " + `${!isValid ? "border-red-500" : ""}`}
                    />
                </div>
                <div className="h-6 my-2 w-60 justify-center">
                    {!isValid && <div className="text-red-500">관리자로 등록되지 않은 계정입니다</div>}
                </div>
                <button
                    type="submit"
                    className="rounded-md cursor-pointer border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 py-2 w-full"
                >
                    <Image
                        className="dark:invert"
                        src="https://nextjs.org/icons/vercel.svg"
                        alt="Vercel logomark"
                        width={20}
                        height={20}
                    />
                    로그인
                </button>
            </form>
        </>
    )
}