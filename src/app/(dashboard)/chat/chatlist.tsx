'use client'
import { useRouter } from "next/navigation";

export default function ChatList() {

    const router = useRouter();

    return (
        <div className="w-64 h-full overflow-y-scroll flex-col border-r border-gray-200">
            <div className="w-full py-4 text-center">친구 목록</div>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9,10,11, 14].map((value) =>
            (<div key={value} className="w-full py-4 px-4 flex flex-row items-center hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push(`/chat/${value}`)}>
                <div className="w-10 h-10 bg-gray-300 rounded-full" />
                <div className="ml-4 flex-col">
                    <div className="font-medium text-sm">{value}</div>
                    <div className="font-normal max-w-48 tail text-gray-400 text-sm">여기엔 이전 대화들</div>
                </div>
            </div>))}
        </div>
    )
}