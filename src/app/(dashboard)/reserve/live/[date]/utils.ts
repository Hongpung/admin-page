export default async function loadDailyReserves(date: Date) {
    try {
        const response = await fetch(`/reserve/live/calendar?year=${date.getFullYear()}&month=${date.getMonth() + 1}`, {
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
        return data as any[];
    } catch (e) {
        console.error(e + "데이터 정보 로딩 실패")
    }
}