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

export default async function loadMonthlyReserves(calendar:{year:number,month:number}){
    try{
        const response = await fetch(`/reserve/live/calendar?year=${calendar.year}&month=${calendar.month}`,{
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        })
        
        if(!response.ok){
            console.error("데이터 정보 로딩 실패")
            throw new Error('서버 status:' + response.statusText);
        }

        const data = await response.json();
        const filteredData = data.map((data:Reservation)=> {data.reservationId, data.date, data.type})
        return filteredData as any[];
        
    }catch(e){
        console.error(e+"데이터 정보 로딩 실패")
    }
}