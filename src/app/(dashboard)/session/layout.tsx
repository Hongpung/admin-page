import type { Metadata } from "next";
import { Suspense } from "react";


export const metadata: Metadata = {
    title: "연습실 이용 내역",
    description: "연습실을 이용한 내역을 확인하는 페이지입니다.",
};

export default function SessionListLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            {children}
        </Suspense>
    );
}
