'use client'
import { useRouter } from "next/navigation";

export default function Header() {
    const router = useRouter();

    return (<header className="bg-slate-300 h-20">
        <div className="flex flex-row  h-20 items-center mx-16 self-center">
            <div className="w-32 h-12 bg-black cursor-pointer"
            onClick={()=>router.push('/dashboard')}
            >로고</div>
        </div>
    </header>)
}