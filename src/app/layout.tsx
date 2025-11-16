import type { Metadata } from "next";
import { geistMono, geistSans } from "@fonts";
import { QueryProvider } from "@admin/shared/components/QueryProvider";
import { ConditionalFooter } from "@admin/shared/components/layout/ConditionalFooter";
import { ConditionalHeader } from "@admin/shared/components/layout/ConditionalHeader";
import { ConditionalMain } from "@admin/shared/components/layout/ConditionalMain";
import "@admin/app/globals.css";

/** 파비콘 파일을 바꿨는데 탭 아이콘이 그대로면 숫자만 올려서 캐시 무력화 */
const FAVICON_REVISION = "1";

export const metadata: Metadata = {
  title: "홍풍 어드민 페이지",
  description: "홍풍 어드민 페이지",
  icons: {
    icon: [
      {
        url: `/favicon.ico?r=${FAVICON_REVISION}`,
        type: "image/x-icon",
        sizes: "any",
      },
    ],
  },
};

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <QueryProvider>
          <ConditionalHeader />
          <ConditionalMain>{children}</ConditionalMain>
          <ConditionalFooter />
        </QueryProvider>
      </body>
    </html>
  );
}
