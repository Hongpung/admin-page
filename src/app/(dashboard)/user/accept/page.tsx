'use client'
import { useEffect, useLayoutEffect, useState } from "react";
import { fetchSignupData, User } from "./utils"
import { clickAccept } from "./utils";
import LoadingDots from "@admin/app/components/loadingindicator";

interface signUpData extends User {
    signupId: number
}

export default function AcceptUserPage() {
    const [page, setPage] = useState(0);
    const [signUpData, setSignUpData] = useState<signUpData[]>([]);
    const [selectedOption, setSelectedOption] = useState("all");
    const [filter, setFilter] = useState<string | null>(null);

    useLayoutEffect(() => {
        const fetchData = async () => {
            try {
                const signUpDataResponse = await fetchSignupData(page); // 서버에서 데이터 가져오기
                setSignUpData(signUpDataResponse); // 데이터 저장
            } catch (error) {
                console.error('Error fetching sign up data:', error);
            }
        };

        fetchData();
    }, [page]);

    useEffect(() => {
        setFilter(null)
    }, [selectedOption])

    function renderSignUp() {
        const rows: JSX.Element[] = [];
        console.log(page + 'called')
        signUpData?.forEach((user, index) => {
            if (user) {
                const userRow = (
                    <div key={index} className="flex-row flex justify-around bg-slate-100 py-1">
                        <div className="min-w-48 text-center">{user.name}</div>
                        <div className="min-w-64 text-center">{user.club}</div>
                        <div className="min-w-96 text-center">{user.email}</div>
                        <button className="min-w-48 text-center" onClick={async () => {
                            {
                                try {
                                    const acceptResult = await clickAccept(user.signupId)

                                    if (!acceptResult) throw Error('회원가입 수락 실패')

                                    const newList = signUpData;

                                    newList.splice(index, 1)

                                    setSignUpData(newList);
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
                {signUpData ?
                    signUpData?.length == 0 ?
                        <div className="text-center flex-grow flex items-center justify-center font-bold text-2xl text-stone-400">
                            가입을 요청한 유저가 없습니다...
                        </div>
                        : rows
                    : <LoadingDots />}
            </>
        );
    }

    return (
        <>
            <div className="text-lg font-medium ml-2 mt-2">가입요청 관리</div>
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
            <div className="flex flex-col mx-2 mt-4 border rounded-md flex-grow border-gray-200 mb-2">
                <div id="rows" className="flex-row flex justify-around bg-slate-100 py-1">
                    <div className="min-w-48 text-center">이름</div>
                    <div className="min-w-64 text-center">동아리</div>
                    <div className="min-w-96 text-center">이메일</div>
                    <div className="min-w-48 text-center">확인</div>
                </div>
                {renderSignUp()}
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
        </>
    )
}