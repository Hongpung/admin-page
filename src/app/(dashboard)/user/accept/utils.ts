
export async function clickAccept(signupId: number) {
    const userData = {
        signupId,
        acceptResult: true
    };

    const result = await acceptUser(userData);
    console.log(result)
    return result;
}

export async function acceptUser(userData: { signupId: number, acceptResult: boolean }): Promise<boolean> {
    try {

        const response = await fetch('/user/accept/api', {
            method: 'POST',
            body: JSON.stringify({ acceptedSignUpIds: [+userData.signupId] }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('실패' + response.status);
        }
        return true;

    } catch (error) {
        console.error('오류 발생:', error);
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
    role: string[]
    [key: string]: string | number | string[] | undefined
}

export async function fetchSignupData() {

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
