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
        return data

    } catch (error) {
        console.error('오류 발생:', error);
    }
    return [];
}

export async function updateUserRole(userData: { memberId: number, role: string[] }) {

    const user = { memberId: userData.memberId, role: [...userData.role] }

    try {
        const response = await fetch("/user/manage/api", {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(user)
        });

        if (!response.ok) throw Error('서버 status:' + response.statusText);
        return true

    } catch (error) {
        console.error('오류 발생:', error);
    }

    return false;
}

export async function deleteUser(memberId: number) {
    try {
        const response = await fetch("/user/manage/api", {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ memberId })
        });

        if (!response.ok) throw Error('서버 status:' + response.statusText);
        return true;

    } catch (error) {
        console.error('오류 발생:', error);
    }

    return false;
}

export const roles = ['패짱', '상쇠', '상장구', '수북', '수법고'];
