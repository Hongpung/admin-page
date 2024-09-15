'use client'
import { useState } from "react";

export default function Home() {

  const [isOpen, setOpen] = useState([false, false, false, false])

  const toggleOpen = (number: number) => {
    console.log(number)
    const newState = [...isOpen];
    newState[number] = !newState[number];

    setOpen(newState);
  };

  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <header className=" bg-slate-300 h-24"></header>
      <main className=" flex flex-row mx-14 h-svh mt-4">

        <div id="left-menu" className=" rounded-md mr-2 h-max sticky top-0 w-auto" >
          <ul>
            <li className="w-40 bg-gray-100 text-sm/4 cursor-pointer px-2 py-2 my-2 flex flex-row justify-between" onClick={() => toggleOpen(0)}>
              <div>유저 관리</div>
              <div>▼</div>
            </li>
            {isOpen[0] &&
              <li className="w-40 text-sm/4 cursor-pointer text-gray-500 px-2 pl-6 py-1 my-2">
                가입요청 관리
              </li>
            }
            {isOpen[0] &&
              <li className="w-40 text-sm/4 cursor-pointer text-gray-500 px-2 pl-6 py-1 my-2">
                유저 권한 관리
              </li>
            }
            <li className="w-40 bg-gray-100 text-sm/4 cursor-pointer px-2 py-2 my-2 flex flex-row justify-between" onClick={() => toggleOpen(1)}>
              <div>예약 관리</div>
              <div>▼</div>
            </li>
            {isOpen[1] &&
              <li className="w-40 text-sm/4 cursor-pointer text-gray-500 px-2 pl-6 py-1 my-2">
                실시간 예약 관리
              </li>
            }
            {isOpen[1] &&
              <li className="w-40 text-sm/4 cursor-pointer text-gray-500  px-2 pl-6 py-1 my-2">
                정기 예약 관리
              </li>
            }
            <li className="w-40 bg-gray-100 text-sm/4 cursor-pointer px-2 py-2 my-2 ">
              <div>1:1 채팅</div>
            </li>
            <li className="w-40 bg-gray-100 text-sm/4 cursor-pointer px-2 py-2 my-2 flex flex-row justify-between" onClick={() => toggleOpen(2)}>
              <div>메인 페이지 관리</div>
              <div>▼</div>
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
              <div>▼</div>
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
        <div id="main-contents" className="my-2 flex flex-col border-gray-200 h-1svh border-solid border rounded-md w-dvw">
          <div className="mx-2 my-2">
            <div className="w-full flex flex-row justify-evenly">
              <div>s</div>
              <div>1</div>
              ss
            </div>
          </div>
          <div>sss</div>
        </div>
      </main>
      <footer className=" flex gap-6 flex-wrap items-center justify-center h-40 bg-gray-500 mt-2">

      </footer>
    </div>
  );
}
