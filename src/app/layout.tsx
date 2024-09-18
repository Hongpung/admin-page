import type { Metadata } from "next";
import "@admin/app/globals.css";
import { geistMono, geistSans } from "@fonts";
import SideMenu from "./dashboard/sidemenu";
import Header from "./header";
import Footer from "./footer";

export const metadata: Metadata = {
  title: "Admin dashboard",
  description: "Admin First Page",
};

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
