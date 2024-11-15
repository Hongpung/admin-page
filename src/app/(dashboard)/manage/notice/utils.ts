import { MIMEType } from "util";

export async function loadNotices() {
    try {
        const response = await fetch(`/manage/notice/load`, {
            credentials: "include"
        })

        if (!response.ok) throw Error();

        const data = await response.json()
        return data;
    } catch (e) {
        console.error(e)
        return null
    }
}

export async function loadSpecificNotice(infoId: number) {
    try {
        const response = await fetch(`/manage/notice/${infoId}`, {
            credentials: "include"
        })

        if (!response.ok) throw Error();

        const data = await response.json()
        return data;
    } catch (e) {
        console.error(e)
        return null
    }
}

export async function registerNotice({ title, content }: { title: string, content: string }) {
    try {
        const response = await fetch(`/manage/notice/create`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({ title, content }),
            credentials: "include"
        })

        if (!response.ok) throw Error();
        return true;
    } catch (e) {
        console.error(e)
        return false
    }
}

export async function updateNotice({ title, content, infoId }: { title: string, content: string, infoId: number }) {
    try {
        const response = await fetch(`/manage/notice/${infoId}`, {
            method: 'PATCH',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({ title, content }),
            credentials: "include"
        })

        if (!response.ok) throw Error();
        return true;
    } catch (e) {
        console.error(e)
        return false
    }
}

export async function deleteNotice({ infoId }: { infoId: number }) {
    try {
        const response = await fetch(`/manage/notice/${infoId}`, {
            method: 'DELETE',
            credentials: "include"
        })

        if (!response.ok) throw Error();
        return true;
    } catch (e) {
        console.error(e)
        return false
    }
}

