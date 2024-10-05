import type { Metadata } from "next";
import "@admin/app/globals.css";
import { Calendar } from "../calendar/calendar";
import { useMemo } from "react";

export const metadata: Metadata = {
    title: "실시간 예약 조회",
    description: "Admin First Page",
};

export default function ManageRoleLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <div className="flex flex-row gap-2">
            <div className="rounded-md border h-full sticky top-6 flex flex-col w-80 border-gray-200 p-2">
                <Calendar/>
            </div>
            <div className="rounded-md border h-auto flex flex-col flex-grow border-gray-200 p-2">
                {children}
            </div>
        </div>
    );
}
