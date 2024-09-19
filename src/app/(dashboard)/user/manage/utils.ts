import { User } from "../accept/utils";

export async function fetchUserData(page: number) {
    try {
        const response = await fetch("http://localhost:3000/member", {
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
        return data as User[];

    } catch (error) {
        console.error('오류 발생:', error);
        throw error;
    }
}