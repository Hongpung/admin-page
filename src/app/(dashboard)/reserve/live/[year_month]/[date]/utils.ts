export async function loadDailyReservations(date: Date) {
    try {
        const response = await fetch(`/reserve/live/date?date=${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${(date.getDate()).toString().padStart(2, '0')}`, {
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

export async function loadDailyOccupiedTimes(date: Date) {
    try {
        const response = await fetch(`/reserve/live/date/occupied?date=${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${(date.getDate()).toString().padStart(2, '0')}`, {
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

export async function createReservation(createData: Object) {
    try {
        console.log(JSON.stringify(createData))
        const response = await fetch(`/reserve/live/reserve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(createData),
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

export async function editReservation(reservationId: number, updateData: Object) {
    try {
        console.log(JSON.stringify(updateData))
        const response = await fetch(`/reserve/live/reserve?reservationId=${reservationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData),
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

        console.log(reservationId)
        const response = await fetch(`/reserve/live/reserve?reservationId=${reservationId}`, {
            method: 'DELETE',
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

export async function searchMembers({ username, clubId, role }: { username?: string, clubId?: string, role?: string }) {
    try {

        const queryString = []
        if (username && username.trim() !== '') {
            queryString.push(`username=${username}`);
        }

        if (clubId) {
            queryString.push(`clubId=${clubId}`);
        }

        if (role) {
            queryString.push(`role=${role}`);
        }

        console.log(queryString)

        const response = await fetch(`/reserve/live/member/search?${queryString.map(string => string).join('&&')}`, {
            method: 'GET',
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