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

export async function updateUserRole(userData: { memberId: number, role: string }) {

    const user = { memberId: userData.memberId, role: getEnglishRole(userData.role) }

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
            body: JSON.stringify({memberId})
        });

        if (!response.ok) throw Error('서버 status:' + response.statusText);
        return true;

    } catch (error) {
        console.error('오류 발생:', error);
    }

    return false;
}


export const roles = [
    { ko: "패짱", en: "LEADER" },           // LEADER
    { ko: "상쇠", en: "PRIMARY_KKWANGGWARI" }, // PRIMARY_KKWANGGWARI
    { ko: "상장구", en: "PRIMARY_JANGGU" }, // PRIMARY_JANGGU
    { ko: "수북", en: "PRIMARY_BUK" },      // PRIMARY_BUK
    { ko: "수법고", en: "PRIMARY_SOGO" },   // PRIMARY_SOGO
    { ko: "수징", en: "PRIMARY_JING" },     // PRIMARY_JING
    { ko: "패원", en: "MEMBER" },          // MEMBER
];

const getEnglishRole = (koreanRole: string) => {
    const role = roles.find(item => item.ko === koreanRole);
    return role ? role.en : null;  // 역할을 찾으면 en 값 반환, 아니면 null 반환
};