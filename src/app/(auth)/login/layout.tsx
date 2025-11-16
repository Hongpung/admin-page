import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "홍풍 | 로그인",
  description: "홍풍 어드민 페이지 로그인",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="flex h-full w-full items-center justify-center">
        {children}
      </div>
      <footer className="absolute bottom-0 left-0 w-full border-t border-gray-300 bg-gray-50">
        <div className="w-full px-6 py-5 text-left text-sm text-gray-600">
          <div className="mx-auto max-w-2xl flex w-full justify-around min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              className="font-medium text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline"
              href="https://storage.hongpung.com/terms/%EC%84%9C%EB%B9%84%EC%8A%A4+%EC%9D%B4%EC%9A%A9%EC%95%BD%EA%B4%80.html"
            >
              이용 약관
            </Link>
            <span className="text-gray-400">|</span>
            <Link
              className="font-medium text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline"
              href="https://storage.hongpung.com/terms/%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4+%EC%B2%98%EB%A6%AC%EB%B0%A9%EC%B9%A8.html"
            >
              개인정보 처리 방침
            </Link>
          </div>
          <div className="mt-4 space-y-1.5 border-t border-gray-200 pt-4">
            <p className="text-base font-semibold text-gray-800">기타 문의</p>
            <p>대표자: 강윤호 (산틀 18)</p>
            <p>전화번호: 010-5034-2854</p>
            <p>이메일: ajtwoddl1236@naver.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
