'use client'
import { useEffect, useLayoutEffect, useState } from "react";
import "@admin/app/globals.css";
import LoadingDots from "@admin/app/components/loadingindicator";
import { getAdminList } from "./utils";

interface Admin {
    memberId: number;
    name: string;
    nickname: string;
    club: string;
    enrollmentNumber: string;
    adminLevel?: 'SUB' | 'SUPER';
}

export default function AdminManagePage() {
    const [page, setPage] = useState(0);
    const [adminData, setAdminData] = useState<Admin[]>([]);
    const [selectedOption, setSelectedOption] = useState("all");
    const [filter, setFilter] = useState<string | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    useEffect(() => {
        const loadAdminList = async () => {
            try {
                const loadedAdminList = await getAdminList();
                setAdminData(loadedAdminList);
            } catch {
                console.error('오류발생')
            }
        }
        loadAdminList();
    }, [])

    useEffect(() => {
        setFilter(null)
    }, [selectedOption])

    function renderAdminList() {
        const rows: JSX.Element[] = [];
        adminData?.forEach((user, index) => {
            if (user) {
                const userRow = (
                    <div key={index} className="flex-row flex items-center justify-around bg-slate-100 py-1">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <input type="checkbox"
                                checked={selectedUsers.some(userId => userId == user.memberId)}
                                onChange={(e) => {
                                    if (e.currentTarget.checked) {
                                        setSelectedUsers(prev => [...prev, user.memberId])
                                    } else {
                                        setSelectedUsers(prev => [...prev].filter(userId => userId != user.memberId))
                                    }
                                }} name="" id="" />
                        </div>
                        <div className="min-w-48 text-center">{user.name + (user.nickname && ` (${user.nickname})`)}</div>
                        <div className="min-w-64 text-center">{user.club}</div>
                        <div className="min-w-96 text-center">{user.adminLevel == 'SUPER' ? '의장' : '부의장'}</div>
                        <button className="min-w-48 text-center" onClick={async () => {
                            {
                                try {
                                    // const acceptResult = await clickAccept(user.signupId)

                                    // if (!acceptResult) throw Error('회원가입 수락 실패')

                                    // const newList = [...signUpData];

                                    // newList.splice(index, 1)

                                    // setSignUpData(newList);
                                }
                                catch (e) {
                                    console.error(e);
                                }
                            }
                        }}>수락</button>
                    </div>
                );
                rows.push(userRow);
            }
        });

        return (
            <>
                {adminData ?
                    adminData?.length == 0 ?
                        <div className="text-center flex-grow flex items-center justify-center font-bold text-2xl text-stone-400">
                            어드민이 없습니다.
                        </div>
                        : rows
                    : <LoadingDots />}
            </>
        );
    }

    return (
        <div className="h-full flex flex-col flex-grow border-gray-200 p-2 border rounded-md">
            <div className="text-lg font-medium ml-2 mt-2">관리자 관리</div>
            <div className="flex flex-row gap-2 h-12 items-center ml-2 mt-2">
                <select name="searchOption" id="search-select"
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.currentTarget.value)}
                    className="w-24 px-1 h-8 border rounded-md">
                    <option value="all">전체</option>
                    <option value="email">이메일</option>
                    <option value="club">동아리</option>
                    <option value="name">이름</option>
                </select>
                <input type="text" value={filter ?? ''} onChange={(e) => { setFilter(e.currentTarget.value) }} name="search-keyword" id="search-keyword" placeholder="검색..." className="w-40 h-8 border px-2 rounded-md" />
                <button type="submit" className="h-8 w-12 bg-blue-100 rounded-md">적용</button>
            </div>
            <div className="mx-3 flex flex-row justify-end gap-4 items-center">
                {selectedUsers.length != 0 && <div className="text-gray-400">({selectedUsers.length}명 선택됨)</div>}
                <div className={`px-2 py-1 ${selectedUsers.length != 0?'bg-red-400 cursor-pointer':'bg-red-100'} rounded text-white`}>삭제</div>
                <div className="px-2 py-1 bg-black text-white rounded cursor-pointer">어드민 추가 하기</div>
            </div>
            <div className="flex flex-col mx-2 mt-4 border rounded-md flex-grow border-gray-200 mb-2">
                <div id="rows" className="flex-row flex justify-around bg-slate-100 py-1">
                    <div className="w-8 text-center">-</div>
                    <div className="min-w-48 text-center">이름 (패명)</div>
                    <div className="min-w-64 text-center">동아리</div>
                    <div className="min-w-96 text-center">권한</div>
                    <div className="min-w-48 text-center">권한설정</div>
                </div>
                {renderAdminList()}
            </div>
            <div className="flex flex-row items-center justify-center gap-2">
                <div className="cursor-pointer">{'<<'}</div>
                <div className="cursor-pointer">{'<'}</div>
                <div className="cursor-pointer" onClick={e => setPage(Number(e.currentTarget.innerText) - 1)}>1</div>
                <div className="cursor-pointer" onClick={e => setPage(Number(e.currentTarget.innerText) - 1)}>2</div>
                <div className="cursor-pointer" onClick={e => setPage(Number(e.currentTarget.innerText) - 1)}>3</div>
                <div className="cursor-pointer" onClick={e => setPage(Number(e.currentTarget.innerText) - 1)}>4</div>
                <div className="cursor-pointer" onClick={e => setPage(Number(e.currentTarget.innerText) - 1)}>5</div>
                <div className="cursor-pointer">{'>'}</div>
                <div className="cursor-pointer">{'>>'}</div>
            </div>
        </div>
    )
}