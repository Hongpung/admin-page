import Link from "next/link";

export default function Footer() {
    return (
        <footer className="flex gap-6 flex-wrap items-start justify-center bg-[#0E0E0E] mt-2">
            <div className="w-full flex flex-col gap-7 pt-6 pb-6  border-gray-200 ">
                <div className="flex justify-center gap-36 items-center text-gray-200">
                    <Link href="https://storage.hongpung.com/terms/%EC%84%9C%EB%B9%84%EC%8A%A4+%EC%9D%B4%EC%9A%A9%EC%95%BD%EA%B4%80.html">
                        <div className="flex-1 text-center text-sm font-normal">이용 약관</div>
                    </Link>
                    |
                    <Link href="https://storage.hongpung.com/terms/%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4+%EC%B2%98%EB%A6%AC%EB%B0%A9%EC%B9%A8.html">
                        <div className="flex-1 text-center text-sm font-normal">개인정보 처리 방침</div>
                    </Link>
                </div>
                <div className="gap-2 px-12">
                    <p className="text-gray-300 text-sm font-normal">기타 문의</p>
                    <div className="gap-1">
                        <p className="text-gray-300 text-sm font-normal">대표자: 강윤호 (산틀 18)</p>
                        <p className="text-gray-300 text-sm font-normal">전화번호: 010-5034-2854</p>
                        <p className="text-gray-300 text-sm font-normal">이메일: ajtwoddl1236@naver.com</p>
                    </div>
                </div>
            </div>
        </footer>
    )
}