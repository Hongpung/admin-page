import type { Metadata } from "next";
import "@admin/app/globals.css";
import { geistMono, geistSans } from "@fonts";
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-grow flex flex-row gap-8 ml-16 mr-32 my-4">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
