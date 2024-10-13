export async function loadDailyReserves(date: Date) {
    try {
        const response = await fetch(`/reserve/live/date?date=${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2,'0')}-${(date.getDate()).toString().padStart(2,'0')}`, {
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

export async function loadReservationDetail(reservationId: number) {
    try {
        const response = await fetch(`/reserve/live/reserve?reservationId=${reservationId}`, {
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

export async function deleteReservation(reservationId: number) {
    try {
        const response = await fetch(`/reserve/live/reserve?reservationId=${reservationId}`, {
            method:'DELETE',
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