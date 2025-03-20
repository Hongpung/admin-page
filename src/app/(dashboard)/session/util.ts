export async function loadLatestSessions(skip:number = 0) {

    try {

        const response = await fetch(`/session/load?skip=${skip}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        })

        if (!response.ok) {
            console.error("데이터 정보 로딩 실패")
            throw new Error('서버 status:' + response.statusText);
        }

        const data = await response.json();
        
        return data;

    } catch (e) {
        console.error(e + "데이터 정보 로딩 실패")
    }
}