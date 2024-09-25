
export async function clickAccept(email: string) {
    const userData = {
        email,
        acceptResult: true
    };
    var result = await acceptUser(userData);
    return result;
}

export async function acceptUser(userData: { email: string, acceptResult: boolean }) {
    try {
        const response = await fetch('/user/accept/api', {
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData),
            credentials: 'include'
        });
        if (response.status == 200)
            return true;
        else
            throw new Error('실패' + response.statusText);
    } catch (error) {
        console.error('오류 발생:', error);
        throw error;
    } finally {
        return false;
    }
}


export interface User {
    username: string
    club: string
    email: string
    role?: string
    [key: string]: string | undefined
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
        return data as User[];

    } catch (error) {
        console.error('오류 발생:', error);
        throw error;
    }
}
