'use client'
import { useEffect, useState } from "react";
import { fetchUserData } from "./utils"
import LoadingDots from "@admin/app/components/loadingindicator";
import { User } from "../accept/utils";


export default function ManageUserPage() {
    const [page, setPage] = useState(0);
    const [userData, setUserData] = useState<User[]>([]);
    const [selectedOption, setSelectedOption] = useState("all");
    const [filter, setFilter] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const option = formData.get('searchOption') as string;
        const keyword = formData.get('search-keyword') as string;

        console.log({ option, keyword });

    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const signUpDataResponse = await fetchUserData(page); // 서버에서 데이터 가져오기
                setUserData(signUpDataResponse); // 데이터 저장
            } catch (error) {
                console.error('Error fetching sign up data:', error);
            }
        };

        fetchData();
    }, [page]);

    useEffect(() => {
        setFilter(null)
    }, [selectedOption])

    useEffect(() => {
        if (selectedOption != "all" && filter) {
            const filteredUsers = userData.filter((user: User) => user[selectedOption] == filter)
            setUserData(filteredUsers);
        }
    }, [filter])


    function renderSignUp() {
        const rows: JSX.Element[] = [];
        console.log(page + 'called')
        userData?.forEach((user, index) => {
            if (user) {
                const userRow = (
                    <div key={index} className="flex-row flex justify-around bg-slate-100 py-1">
                        <div>{user.username}</div>
                        <div>{user.club}</div>
                        <div>{user.email}</div>
                        <button onClick={() => { }}>{user.role}권한 관리</button>
                    </div>
                );
                rows.push(userRow);
            }
        });

        return (
            <>
                {userData ?
                    userData?.length == 0 ?
                        <div className="text-center flex-grow flex items-center justify-center font-bold text-2xl text-stone-400">
                            가입한 유저가 없습니다...
                        </div>
                        : rows
                    : <LoadingDots />}
            </>
        );
    }

    return (
        <>
            <div className="text-lg font-medium ml-2 mt-2">유저 권한 관리</div>
            <form className="flex flex-row gap-2 h-12 items-center ml-2 mt-2" onSubmit={handleSubmit}>
                <select
                    name="searchOption"
                    id="searchOption"
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.currentTarget.value)}
                    className="w-24 px-1 h-8 border rounded-md"
                >
                    <option value="all">전체</option>
                    <option value="email">이메일</option>
                    <option value="club">동아리</option>ㅈ
                    <option value="name">이름</option>
                    <option value="role">역할</option>
                </select>
                {selectedOption === "role" ? (
                    <>
                        <label>
                            <input type="radio" name="search-keyword" id="role-all" defaultChecked value="전체" /> 전체
                        </label>
                        <label>
                            <input type="radio" name="search-keyword" id="role-paejjang" value="패짱" /> 패짱
                        </label>
                        <label>
                            <input type="radio" name="search-keyword" id="role-sangsoi" value="상쇠" /> 상쇠
                        </label>
                        <label>
                            <input type="radio" name="search-keyword" id="role-sangjanggu" value="상장구" /> 상장구
                        </label>
                        <label>
                            <input type="radio" name="search-keyword" id="role-subuk" value="수북" /> 수북
                        </label>
                        <label>
                            <input type="radio" name="search-keyword" id="role-subupgo" value="수법고" /> 수법고
                        </label>
                    </>
                ) : (
                    <input
                        type="text"
                        value={filter ?? ''}
                        onChange={(e) => setFilter(e.currentTarget.value)}
                        name="search-keyword"
                        id="search-keyword"
                        placeholder="검색..."
                        className="w-40 h-8 border px-2 rounded-md"
                    />
                )}

                <button type="submit" className="h-8 w-12 bg-blue-100 rounded-md">적용</button>
            </form>

            <div className="flex flex-col mx-2 mt-4 border rounded-md flex-grow border-gray-200 mb-2">
                <div id="rows" className="flex-row flex justify-around bg-slate-100 py-1">
                    <div>이름</div>
                    <div>동아리</div>
                    <div>이메일</div>
                    <div>권한</div>
                </div>
                {renderSignUp()}
            </div>
            <div className="flex flex-row items-center justify-center gap-2">
                <div className="cursor-pointer">{'<<'}</div>
                <div className="cursor-pointer">{'<'}</div>
                <div className="cursor-pointer" onClick={e => setPage(Number(e.currentTarget.innerText) - 1)}>1</div>
                <div className="cursor-pointer">2</div>
                <div className="cursor-pointer">3</div>
                <div className="cursor-pointer">4</div>
                <div className="cursor-pointer">5</div>
                <div className="cursor-pointer">{'>'}</div>
                <div className="cursor-pointer">{'>>'}</div>
            </div>
        </>
    )
}