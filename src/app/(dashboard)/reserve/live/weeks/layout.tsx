import type { Metadata } from "next";
import "@admin/app/globals.css";

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
        <>{children}</>
    );
}
