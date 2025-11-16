import Link from "next/link";
import { ADMIN_SUPPORT_EMAIL } from "@admin/shared/constants/support-contact";

export default function Footer() {
    return (
        <footer className="mt-2 flex flex-wrap items-start justify-center gap-6 border-t border-gray-300 bg-gray-50">
            <div className="w-full border-gray-200 pb-6 pt-6 flex flex-col gap-7">
                <div className="flex items-center justify-center gap-36 text-gray-600">
                    <Link href="https://storage.hongpung.com/terms/%EC%84%9C%EB%B9%84%EC%8A%A4+%EC%9D%B4%EC%9A%A9%EC%95%BD%EA%B4%80.html">
                        <div className="flex-1 text-center text-sm font-normal hover:text-gray-900">이용 약관</div>
                    </Link>
                    <span className="text-gray-400">|</span>
                    <Link href="https://storage.hongpung.com/terms/%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4+%EC%B2%98%EB%A6%AC%EB%B0%A9%EC%B9%A8.html">
                        <div className="flex-1 text-center text-sm font-normal hover:text-gray-900">개인정보 처리 방침</div>
                    </Link>
                </div>
                <div className="gap-2 px-12">
                    <p className="text-sm font-medium text-gray-700">기타 문의</p>
                    <div className="gap-1">
                        <p className="text-sm font-normal text-gray-600">대표자: 강윤호 (산틀 18)</p>
                        <p className="text-sm font-normal text-gray-600">전화번호: 010-5034-2854</p>
                        <p className="text-sm font-normal text-gray-600">이메일: {ADMIN_SUPPORT_EMAIL}</p>
                    </div>
                </div>
            </div>
        </footer>
    )
}