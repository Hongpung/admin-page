interface briefReservation {
    reservationId: number;              // 예약 ID
    creatorName: string;                // 생성자 이름
    date: string;                       // 예약 날짜 (YYYY-MM-DD 형식)
    reservationType: 'REGULAR' | 'COMMON' | 'EXTERNAL';                       // 예약 유형
    startTime: string;                  // 시작 시간 (HH:MM:SS 형식)
    endTime: string;                    // 종료 시간 (HH:MM:SS 형식)
    title: string;                    // 예약 메시지
    participationAvailable: boolean;    // 참여 가능 여부
    lastmodified: string;               // 마지막 수정 시간 (ISO 8601 형식)
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
        const filteredData: { [key: number]: {
            participationAvailable: boolean;
            reservationType: string;
            reservationId: number;
        }[] } = [];
        data.map((reservation: briefReservation) => {
            const reserveDate = new Date(reservation.date).getDate();
            if (!filteredData[reserveDate]) filteredData[reserveDate] = [{ reservationId: reservation.reservationId, reservationType: reservation.reservationType, participationAvailable: reservation.participationAvailable, }];
            else filteredData[reserveDate] = [...filteredData[reserveDate], { reservationId: reservation.reservationId, reservationType: reservation.reservationType, participationAvailable: reservation.participationAvailable, }];
        })
        return filteredData;

    } catch (e) {
        console.error(e + "데이터 정보 로딩 실패")
    }
}