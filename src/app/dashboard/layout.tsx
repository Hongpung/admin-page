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
        <div>
            <main className=" flex flex-row mx-14 h-auto my-4">
                <SideMenu/>
                <div id="main-contents" className="w-dvw">
                    {children}
                </div>
            </main>
        </div>
    );
}
