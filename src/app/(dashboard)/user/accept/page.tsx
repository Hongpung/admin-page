'use client'
import { useEffect, useLayoutEffect, useState } from "react";
import { fetchSignupData, User } from "./utils"
import { clickAccept } from "./utils";
import LoadingDots from "@admin/app/components/loadingindicator";

interface signUpData extends User {
    signupId: number
}

export default function AcceptUserPage() {
    const [signUpData, setSignUpData] = useState<signUpData[]>([]);

    useLayoutEffect(() => {
        const fetchData = async () => {
            try {
                const signUpDataResponse = await fetchSignupData(); // 서버에서 데이터 가져오기
                setSignUpData(signUpDataResponse); // 데이터 저장
            } catch (error) {
                console.error('Error fetching sign up data:', error);
            }
        };

        fetchData();
    }, []);

    function renderSignUp() {
        const rows: JSX.Element[] = [];
        signUpData?.forEach((user, index) => {
            if (user) {
                const userRow = (
                    <div key={index} className="flex-row flex justify-around bg-slate-100 py-1">
                        <div className="min-w-48 text-center">{user.name}{(user.nickname ? ` (${user.nickname})` : '')}</div>
                        <div className="min-w-64 text-center">{user.club}</div>
                        <div className="min-w-96 text-center">{user.email}</div>
                        <button className="min-w-48 text-center" onClick={async () => {
                            {
                                try {
                                    const acceptResult = await clickAccept(user.signupId)

                                    if (!acceptResult) throw Error('회원가입 수락 실패')

                                    const newList = [...signUpData];

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
            <div className="flex flex-col mx-2 mt-4 border rounded-md flex-grow border-gray-200 mb-2">
                <div id="rows" className="flex-row flex justify-around bg-slate-100 py-1">
                    <div className="min-w-48 text-center">이름 (패명)</div>
                    <div className="min-w-64 text-center">동아리</div>
                    <div className="min-w-96 text-center">이메일</div>
                    <div className="min-w-48 text-center">확인</div>
                </div>
                {renderSignUp()}
            </div>
        </>
    )
}