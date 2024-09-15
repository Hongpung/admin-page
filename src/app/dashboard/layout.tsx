import type { Metadata } from "next";
import "@admin/app/globals.css";


export const metadata: Metadata = {
    title: "Admin dashboard",
    description: "Admin First Page",
};

export default function DashBoardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body>
                {children}
            </body>
        </html>
    );
}
