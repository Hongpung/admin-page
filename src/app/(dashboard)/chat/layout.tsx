import type { Metadata } from "next";
import "@admin/app/globals.css";
import ChatList from "./chatlist";

export const metadata: Metadata = {
    title: "채팅",
    description: "Admin First Page",
};


export default function ChatLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="border border-gray-200 rounded-md h-85vh flex flex-row border-collapse overflow-hidden">
            <ChatList />
            {children}
        </div>
    )
}