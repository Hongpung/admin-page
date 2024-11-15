import type { Metadata } from "next";
import "@admin/app/globals.css";
import SideMenu from "./sidemenu";

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
        <>
            <SideMenu />
            <div id="main-contents" className="w-dvw">
                {children}
            </div>
        </>
    );
}
