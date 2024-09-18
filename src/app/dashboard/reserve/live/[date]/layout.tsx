import type { Metadata } from "next";
import "@admin/app/globals.css";
import { Calendar } from "@admin/app/components/calendar";

export const metadata: Metadata = {
    title: "실시간 예약 조회",
    description: "Admin First Page",
};

export default function ManageRoleLayout({
    children, params
}: Readonly<{
    children: React.ReactNode, params: { date: string }
}>) {
    const { date } = params;
    return (
        <div className="flex flex-row gap-2">
            <div className="rounded-md border h-full sticky top-6 flex flex-col w-80 border-gray-200 p-2">
                <Calendar calendarDate={new Date(date)} />
            </div>
            <div className="rounded-md border h-auto flex flex-col flex-grow border-gray-200 p-2">
                {children}
            </div>
        </div>
    );
}
