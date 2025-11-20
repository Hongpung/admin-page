import type { Metadata } from "next";
import { ReservationWeekUiBoundary } from "@admin/features/reservation";

export const metadata: Metadata = {
  title: "실시간 예약 조회",
  description: "Admin First Page",
};

export default function ManageRoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ReservationWeekUiBoundary>{children}</ReservationWeekUiBoundary>;
}
