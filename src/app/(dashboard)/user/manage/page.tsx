'use client'
import { useEffect, useRef, useState } from "react";
import { deleteUser, fetchUserData, roles, updateUserRole } from "./utils"
import LoadingDots from "@admin/app/components/loadingindicator";
import { User } from "../accept/utils";


export default function ManageUserPage() {

    const [page, setPage] = useState(0);
    const [maxPage, setMaxPage] = useState(0);
    const [userData, setUserData] = useState<User[]>([]);
    const [modifiedUser, setModifiedUser] = useState<User | null>(null)

    const [keyword, setKeyword] = useState('')
    const [clubId, setClubId] = useState<string | undefined>(undefined)
    const [role, setRole] = useState<string | undefined>(undefined)

    const searchRef = useRef<HTMLFormElement>(null)


    const handleReset = () => {

        searchRef.current?.reset();

        setKeyword('')
        setClubId(undefined)
        setRole(undefined)
        setPage(0)


    }


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {

        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const keyword = formData.get('keyword') as string;
        const clubId = formData.get('clubId') as string;
        const role = formData.get('role') as string;

        console.log({ keyword, clubId, role });

        setKeyword(keyword);
        setClubId(clubId === 'none' ? undefined : clubId);
        setRole(role === 'none' ? undefined : role);

        const fetchReserveDetails = async () => {

            const response = await fetchUserData({ username: keyword.length > 0 ? keyword : undefined, clubId: clubId === 'none' ? undefined : clubId, role: role === 'none' ? undefined : role })

            const { totalPages, members } = response;

            console.log(members, totalPages)

            setMaxPage(totalPages);
            setUserData(members);
        }

        fetchReserveDetails();

    };

    useEffect(() => {
        const fetchReserveDetails = async () => {

            const response = await fetchUserData({ username: keyword.length > 0 ? keyword : undefined, clubId, role, page })

            const { totalPages, members } = response;
            console.log(members, totalPages)

            setMaxPage(totalPages);
            setUserData(members);
        }

        fetchReserveDetails();

    }, [page, keyword, clubId, role])

    function renderMembers() {
        const rows: JSX.Element[] = [];
        userData?.sort((a, b) => a.enrollmentNumber - b.enrollmentNumber).forEach((user, index) => {
            if (user) {
                const userRow = (
                    <div key={index} className={`flex-row flex justify-around ${index % 2 == 1 ? 'bg-blue-100' : ''} py-1`}>
                        <div className="min-w-48 text-center">{user.name + (user.nickname ? ` (${user.nickname})` : '')}</div>
                        <div className="min-w-24 text-center">{user.club} ({user.enrollmentNumber})</div>
                        <div className="min-w-96 text-center">{user.email}</div>
                        <div className={"min-w-32 text-center" + ` ${user.role.length == 0 ? 'text-gray-300' : ''}`}>{user.role.length == 0 ? '-' : user.role.map(role => role).join(', ')}</div>
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
            <div className="text-lg font-medium ml-2 mt-2">유저 권한 관리 ({userData?.length})</div>
            <form ref={searchRef} className="flex flex-row gap-4 h-12 items-center ml-2 mt-2" onSubmit={handleSubmit} onReset={handleReset}>

                <input type="text" name="keyword" id="keyword" placeholder='여기에 검색어' className='border border-[#446fdb] rounded px-2 py-0.5 outline-[#1e3a80]' />

                <select name="clubId" id="clubId" className='border border-[#446fdb] rounded px-2 py-0.5 outline-[#1e3a80]'>
                    <option selected value="none">동아리</option>
                    <option value="0">들녘</option>
                    <option value="1">산틀</option>
                    <option value="2">악반</option>
                    <option value="3">신명화랑</option>
                </select>

                <select name="role" id="role" className='border border-[#446fdb] rounded px-2 py-0.5 outline-[#1e3a80]'>
                    <option selected value="none">역할</option>
                    <option value="패짱">패짱</option>
                    <option value="상쇠">상쇠</option>
                    <option value="상장구">상장구</option>
                    <option value="수북">수북</option>
                    <option value="수법고">수법고</option>
                </select>

                <button type="submit" className='bg-blue-500 text-white rounded px-2 py-0.5'>검색</button>
                <button type="reset" className='bg-red-500 text-white rounded px-2 py-0.5' onClick={handleReset}>초기화</button>
            </form>

            <div className="flex flex-col mx-2 mt-4 border rounded-md flex-grow border-blue-100 mb-2 overflow-y-auto min-h-[672px]">
                <div id="rows" className="flex-row flex justify-around bg-blue-300 py-1">
                    <div className="min-w-48 text-center">이름 (패명)</div>
                    <div className="min-w-24 text-center">동아리 (학번)</div>
                    <div className="min-w-96 text-center">이메일</div>
                    <div className="min-w-32 text-center">역할</div>
                    <div className="text-center min-w-32"></div>
                </div>
                {renderMembers()}

            </div>
            {maxPage > 1 &&
                <div className="flex flex-row justify-center items-center gap-2 mt-4">{
                    Array.from({ length: maxPage }, (_, index) => (
                        <button key={index} onClick={() => setPage(index)} className={`px-2 py-1 rounded-md ${page == index ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>{index + 1}</button>
                    ))
                }</div>
            }
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
                    <div className="flex flex-col gap-6">
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