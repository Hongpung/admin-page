'use client'
import { useEffect, useState } from "react";
import { deleteUser, fetchUserData, roles, updateUserRole } from "./utils"
import LoadingDots from "@admin/app/components/loadingindicator";
import { User } from "../accept/utils";


export default function ManageUserPage() {
    const [page, setPage] = useState(0);
    const [userData, setUserData] = useState<User[]>([]);
    const [selectedOption, setSelectedOption] = useState("all");
    const [filter, setFilter] = useState<string | null>(null);
    const [modifiedUser, setModifiedUser] = useState<User | null>(null)



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
                const signUpDataResponse = await fetchUserData(0);
                setUserData(signUpDataResponse); // 데이터 저장
            } catch (error) {
                console.error('Error fetching sign up data:', error);
            }
        };

        fetchData();
    }, []);

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
        userData?.forEach((user, index) => {
            if (user) {
                const userRow = (
                    <div key={index} className={`flex-row flex justify-around ${index % 2 == 1 ? 'bg-blue-100' : ''} py-1`}>
                        <div className="min-w-48 text-center">{user.name + (user.nickname ? ` (${user.nickname})` : '')}</div>
                        <div className="min-w-24 text-center">{user.club}</div>
                        <div className="min-w-96 text-center">{user.email}</div>
                        <div className="min-w-32 text-center">{user.role.length == 0 ? '없음' : user.role.map(role => role).join(', ')}</div>
                        <div className="flex flex-col items-center cursor-pointer text-center min-w-32" onClick={() => { setModifiedUser(user) }}>
                            <div className="px-2 py-0.5 rounded-md text-sm bg-green-200 ">역할 변경</div>
                        </div>
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

    const userDeleteHandler = () => {
        const deleteFetch = async (user: User) => {
            try {
                const response = await deleteUser(user.memberId)

                if (!response) throw Error('Failed to Delete User')

                alert(`${user.name}님을 회원에서 삭제했습니다.`)
                // setPage(0)
            }
            catch (e) {
                alert('회원 삭제에 실패했습니다.')
            }

        }

        if (modifiedUser)
            if (confirm(`${modifiedUser.name}님을 회원에서 삭제하시겠습니까?`))
                deleteFetch(modifiedUser);
    }

    const modifedRoleHandler = async () => {
        const changedRole = modifiedUser?.role || []
        console.log(changedRole)

        try {
            const response = updateUserRole({ memberId: modifiedUser!.memberId, role: changedRole })

            if (!response) throw Error('실패')

            setUserData(userData.map(user => {
                if (user.memberId == modifiedUser!.memberId)
                    return { ...user, role: [...changedRole] };
                return user;
            }))
            setModifiedUser(null);
        } catch (e) {
            window.alert('업데이트 실패')
        }
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
                    <option value="club">동아리</option>
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

            <div className="flex flex-col mx-2 mt-4 border rounded-md flex-grow border-blue-100 mb-2 overflow-y-auto">
                <div id="rows" className="flex-row flex justify-around bg-blue-300 py-1">

                    <div className="min-w-48 text-center">이름 (패명)</div>
                    <div className="min-w-24 text-center">동아리</div>
                    <div className="min-w-96 text-center">이메일</div>
                    <div className="min-w-32 text-center">역할</div>
                    <div className="text-center min-w-32"></div>
                </div>
                {renderSignUp()}
            </div>

            <div className={`${modifiedUser ? 'fixed' : 'hidden'} flex left-0 w-full h-full top-0 items-center justify-center bg-black bg-opacity-35`}>
                <div className="relative w-96 bg-white rounded-lg z-10 py-4 px-4 gap-6 flex flex-col">
                    <div className="absolute top-3 cursor-pointer text-lg right-4 font-bold text-gray-400" onClick={() => setModifiedUser(null)}>x</div>
                    <div className="text-lg font-semibold">권한 변경</div>
                    <div className="flex flex-row justify-between items-center mx-4">
                        <div className="text-gray-400">선택된 유저</div>
                        <div className="min-w-20 text-right">{modifiedUser?.name}{`${modifiedUser?.nickname ? ` (${modifiedUser?.nickname})` : ``}`}</div>
                    </div>
                    <div className="flex flex-row justify-between items-center mx-4">
                        <div className=" text-gray-400">기존 권한</div>
                        <div className=" text-right ">{modifiedUser?.role.length == 0 ? '동아리원' : modifiedUser?.role.join(', ')}</div>
                    </div>
                    <div  className="flex flex-col gap-6">
                        <div className="flex flex-row justify-between items-start mx-4">
                            <div className="font-semibold">변경할 권한</div>
                            <div className="flex flex-col gap-2">
                                {roles.map(role =>
                                (<label key={role}>
                                    <input
                                        type="checkbox"
                                        name={"changed-role-" + role}
                                        id={"changed-role-" + role}
                                        checked={modifiedUser?.role.some(userRole =>
                                            userRole == role
                                        )}
                                        className="mr-1"
                                        onChange={(e) => {
                                            if (!!modifiedUser) {
                                                if (e.currentTarget.checked)
                                                    setModifiedUser({ ...modifiedUser, role: [...modifiedUser.role, role] })
                                                else
                                                    setModifiedUser({ ...modifiedUser, role: modifiedUser.role.filter(userRole => userRole != role) })
                                                console.log(e.currentTarget.checked, role)
                                            }
                                        }} />
                                    {role}
                                </label>)
                                )}
                            </div>
                        </div>
                        <div className="flex flex-row justify-end items-center h-fit gap-2">
                            <div className="px-2 p-1 bg-red-500 text-white cursor-pointer rounded-md font-semibold" onClick={userDeleteHandler}>회원 삭제</div>
                            <div className="px-2 p-1 bg-blue-500 text-white cursor-pointer rounded-md font-semibold" onClick={modifedRoleHandler}>변경</div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}