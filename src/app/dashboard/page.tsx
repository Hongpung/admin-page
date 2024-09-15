

export default function Home() {

    return (
        <div className="font-[family-name:var(--font-geist-sans)]">
            <header className=" bg-slate-300 h-24"></header>
            <main className=" flex flex-row mx-14 h-svh mt-4">

                <div id="lef-tmenu" className=" rounded-md mr-2 h-max sticky top-8 w-auto py-2 ">
                    <ul>
                        <li className="w-44 bg-gray-100 text-sm/4 cursor-pointer px-2 py-1 my-2 flex flex-row justify-between">
                            <div>유저 관리</div>
                            <div>▼</div>
                        </li>
                        {
                            <li>
                                가입요청 관리
                            </li>
                        }
                        {
                            <li>
                                가입요청 관리
                            </li>
                        }
                        <li className="w-44 bg-gray-100 text-sm/4 cursor-pointer px-2 py-1 my-2 flex flex-row justify-between">
                            <div>예약 관리</div>
                            <div>▼</div>
                        </li>
                        <li className="w-44 bg-gray-100 text-sm/4 cursor-pointer px-2 py-1 my-2 flex flex-row justify-between">
                            <div>1:1 채팅</div>
                            <div>▼</div>
                        </li>
                        <li className="w-44 bg-gray-100 text-sm/4 cursor-pointer px-2 py-1 my-2 flex flex-row justify-between">
                            <div>메인 페이지 관리</div>
                            <div>▼</div>
                        </li>
                        <li className="w-44 bg-gray-100 text-sm/4 cursor-pointer px-2 py-1 my-2 flex flex-row justify-between">
                            <div>관리자 관리</div>
                            <div>▼</div>
                        </li>
                    </ul>
                </div>
                <div id="main-contents" className=" border-gray-200 border-solid border rounded-md w-dvw">

                </div>
            </main>
            <footer className=" flex gap-6 flex-wrap items-center justify-center">

            </footer>
        </div>
    );
}
