import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용 취소된 예약",
  description: "취소된 예약 목록",
};

export default function DiscardedReservationsLayout({
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
