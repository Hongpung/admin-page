import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 계정",
  description: "관리자 계정 관리",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="rounded-md border flex flex-col flex-grow border-gray-200 p-2">
      {children}
    </div>
  );
}
