import type { Metadata } from "next";
import "@admin/app/globals.css";

export const metadata: Metadata = {
    title: "정기 예약 관리",
    description: "Admin First Page",
};

export default function ManageRoleLayout({
    children
}: Readonly<{
    children: React.ReactNode, params: { date: string }
}>) {

    return (
        <div className="rounded-md border h-auto min-h-svh flex flex-col flex-grow border-gray-200 p-2">
            {children}
        </div>

    );
}