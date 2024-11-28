
export async function clickAccept(signupId: number) {
    const userData = {
        signupId,
        acceptResult: true
    };
    var result = await acceptUser(userData);

    return result;
}

export async function acceptUser(userData: { signupId: number, acceptResult: boolean }) {
    try {
        const response = await fetch('/user/accept/api', {
            method: 'POST',
            body: JSON.stringify({ acceptedSignUpIds: [userData.signupId] }),
            credentials: 'include'
        });

        if (!response.ok) throw new Error('실패' + response.statusText);

        return true;

    } catch (error) {
        console.error('오류 발생:', error);
        throw error;
    } finally {
        return false;
    }
}


export interface User {
    memberId: number
    name: string
    nickname?: string
    enrollmentNumber: number
    club: string
    email: string
    role?: string
    [key: string]: string | number | undefined
}

export async function fetchSignupData(page: number) {

    try {

        const response = await fetch("/user/accept/api", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('서버 status:' + response.statusText);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('오류 발생:', error);
        throw error;
    }
}
