'use client'
import { useRouter } from "next/navigation";
import Image from 'next/image'
import LogoImage from "@public/small_logo.png"

export default function Header() {
    const router = useRouter();

    return (<header className="bg-slate-300 h-20">
        <div className="flex flex-row  h-20 items-center mx-16 self-center">
            <div className="w-32 h-12 cursor-pointer"
                onClick={() => router.push('/home')}
            >
                <Image
                    src={LogoImage} // public 폴더에 있는 이미지 경로
                    alt="Logo"
                    width={50} // 이미지의 가로 크기
                    height={50}
                />
            </div>
        </div>
    </header>)
}