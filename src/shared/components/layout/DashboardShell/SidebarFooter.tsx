import Link from "next/link";
import { ADMIN_SUPPORT_EMAIL } from "@admin/shared/constants/support-contact";

export function SidebarFooter({
  collapsed,
  visible,
}: {
  collapsed: boolean;
  visible: boolean;
}) {
  if (collapsed || !visible) return null;

  return (
    <footer className="w-full min-w-0 shrink-0 border-t border-gray-300 bg-gray-50 px-3 py-4 text-xs text-gray-600 block">
      <div className="flex w-full min-w-0 flex-wrap items-center justify-around px-1">
        <Link
          className="hover:text-gray-900 underline-offset-2 hover:underline"
          href="https://storage.hongpung.com/terms/%EC%84%9C%EB%B9%84%EC%8A%A4+%EC%9D%B4%EC%9A%A9%EC%95%BD%EA%B4%80.html"
        >
          이용 약관
        </Link>
        <span className="text-gray-400">|</span>
        <Link
          className="hover:text-gray-900 underline-offset-2 hover:underline"
          href="https://storage.hongpung.com/terms/%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4+%EC%B2%98%EB%A6%AC%EB%B0%A9%EC%B9%A8.html"
        >
          개인정보 처리 방침
        </Link>
      </div>
      <div className="mt-3 space-y-1 border-gray-300 pt-3">
        <p className="font-medium text-gray-700">기타 문의</p>
        <p>대표자: 강윤호 (산틀 18)</p>
        <p>전화번호: 010-5034-2854</p>
        <p>이메일: {ADMIN_SUPPORT_EMAIL}</p>
      </div>
    </footer>
  );
}
