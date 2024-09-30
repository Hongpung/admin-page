import { User } from "../accept/utils";

export async function fetchUserData(page: number) {
    try {
        const response = await fetch("/user/manage/api", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('서버 status:' + response.statusText);
        }

        const data = await response.json();
        return data.filter((user: User) => user.role != '홍풍의장') as User[];

    } catch (error) {
        console.error('오류 발생:', error);
    }
    return false;
}

export async function updageUserRole(userData: { memberId: number, role: string }) {
    try {
        const response = await fetch("/user/manage/api", {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(userData)
        });

        if (!response.ok) throw Error('서버 status:' + response.statusText);
        return true

    } catch (error) {
        console.error('오류 발생:', error);
    }

    return false;
}