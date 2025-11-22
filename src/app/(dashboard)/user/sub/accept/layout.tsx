import type { Metadata } from "next";


export const metadata: Metadata = {
    title: "유저 가입 수락",
    description: "Admin First Page",
};

export default function AcceptSignUpLayout({
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
