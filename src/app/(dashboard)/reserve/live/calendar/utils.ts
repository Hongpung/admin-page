interface Reservation {
    reservationId: number;
    creatorName: string;
    date: string; // 날짜 형식은 "YYYY-MM-DD"
    type: string;
    startTime: string; // 시간 형식은 "HH:MM:SS"
    endTime: string;   // 시간 형식은 "HH:MM:SS"
    message: string;
    participationAvailable: boolean;
    lastmodified: string; // 날짜와 시간 형식은 ISO 8601 형식
}

export default async function loadMonthlyReserves(calendar: { year: number, month: number }) {
    try {
        const response = await fetch(`/reserve/live/calendar?year=${calendar.year}&month=${calendar.month}`, {
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
        const filteredData: { [key: number]: any[] } = [];
        data.map((reserve: Reservation) => {
            const reserveDate = new Date(reserve.date).getDate();
            if (!filteredData[reserveDate]) filteredData[reserveDate] = [{ id: reserve.reservationId, type: reserve.type, participationAvailable: reserve.participationAvailable, title: reserve.message, creator: reserve.creatorName, startTime: reserve.startTime.slice(0, -3), endTime: reserve.endTime.slice(0, -3) }];
            else filteredData[reserveDate] = [...filteredData[reserveDate], { id: reserve.reservationId, type: reserve.type, participationAvailable: reserve.participationAvailable, title: reserve.message, creator: reserve.creatorName, startTime: reserve.startTime.slice(0, -3), endTime: reserve.endTime.slice(0, -3) }];
        })
        return filteredData;

    } catch (e) {
        console.error(e + "데이터 정보 로딩 실패")
    }
}