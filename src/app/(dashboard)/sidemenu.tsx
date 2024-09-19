'use client'

import { useState } from "react";
import { useRouter } from 'next/navigation'

export default function SideMenu() {
    const [isOpen, setOpen] = useState([false, false, false, false])
    const router = useRouter();
    const toggleOpen = (number: number) => {

        const newState = [...isOpen];
        newState[number] = !newState[number];

        setOpen(newState);
    };
    return (
        <div id="left-menu" className=" rounded-md mr-2 h-max sticky top-4 w-auto" >
            <ul>
                <li className="w-40 bg-gray-100 text-sm/4 cursor-pointer px-2 py-2 my-2 flex flex-row justify-between" onClick={() => toggleOpen(0)}>
                    <div>유저 관리</div>
                    {isOpen[0] ? <div>▲</div> : <div>▼</div>}
                </li>
                {isOpen[0] &&
                    <li className="w-40 text-sm/4 cursor-pointer text-gray-500 px-2 pl-6 py-1 my-2"
                        onClick={() => router.push('/user/accept')}>
                        가입요청 관리
                    </li>
                }
                {isOpen[0] &&
                    <li className="w-40 text-sm/4 cursor-pointer text-gray-500 px-2 pl-6 py-1 my-2"
                        onClick={() => router.push('/user/manage')}>
                        유저 권한 관리
                    </li>
                }
                <li className="w-40 bg-gray-100 text-sm/4 cursor-pointer px-2 py-2 my-2 ">
                    <div>악기 관리</div>
                </li>
                <li className="w-40 bg-gray-100 text-sm/4 cursor-pointer px-2 py-2 my-2 flex flex-row justify-between" onClick={() => toggleOpen(1)}>
                    <div>예약 관리</div>
                    {isOpen[1] ? <div>▲</div> : <div>▼</div>}
                </li>
                {isOpen[1] &&
                    <li className="w-40 text-sm/4 cursor-pointer text-gray-500 px-2 pl-6 py-1 my-2"
                        onClick={() => {
                            const today = new Date();
                            router.push(`/reserve/live/${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`)
                        }}>
                        실시간 예약 관리
                    </li>
                }
                {isOpen[1] &&
                    <li className="w-40 text-sm/4 cursor-pointer text-gray-500  px-2 pl-6 py-1 my-2"
                        onClick={() => router.push('/reserve/regular')}>
                        정기 예약 관리
                    </li>
                }
                <li className="w-40 bg-gray-100 text-sm/4 cursor-pointer px-2 py-2 my-2 "
                    onClick={() => router.push('/chat/index')}>
                    <div>1:1 채팅</div>
                </li>
                <li className="w-40 bg-gray-100 text-sm/4 cursor-pointer px-2 py-2 my-2 flex flex-row justify-between" onClick={() => toggleOpen(2)}>
                    <div>메인 페이지 관리</div>
                    {isOpen[2] ? <div>▲</div> : <div>▼</div>}
                </li>
                {isOpen[2] &&
                    <li className="w-40 text-sm/4 cursor-pointer text-gray-500 px-2 pl-6 py-1 my-2">
                        배너 관리
                    </li>
                }
                {isOpen[2] &&
                    <li className="w-40 text-sm/4 cursor-pointer text-gray-500 px-2 pl-6 py-1 my-2">
                        공지사항
                    </li>
                }
                <li className="w-40 bg-gray-100 text-sm/4 cursor-pointer px-2 py-2 my-2 flex flex-row justify-between" onClick={() => toggleOpen(3)}>
                    <div>관리자 관리</div>
                    {isOpen[3] ? <div>▲</div> : <div>▼</div>}
                </li>
                {isOpen[3] &&
                    <li className="w-40 text-sm/4 cursor-pointer text-gray-500 px-2 pl-6 py-1 my-2">
                        관리자 권한 관리
                    </li>
                }
                {isOpen[3] &&
                    <li className="w-40 text-sm/4 cursor-pointer text-gray-500 px-2 pl-6 py-1 my-2">
                        로그인 정보 확인
                    </li>
                }
            </ul>
        </div>
    )
}