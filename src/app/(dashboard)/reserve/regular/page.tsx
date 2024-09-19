'use client'
import { useEffect, useState } from 'react';

interface Reservation {
    club: '들녘' | '산틀' | '신명화랑' | '악반' | '기타';
    weekday: 'm' | 't' | 'w' | 'th' | 'f' | 's' | 'su';
    startTime: 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21;
    endTime: 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22;
}

export default function RegularReservePage() {
    const [month, setMonth] = useState(new Date().getMonth());
    const [reservations, setReservations] = useState<Reservation[]>([]);

    const fetchReservations = async () => {

        const response = await fetch('/api/reservations');
        const data = await response.json();
        setReservations(data);
    };

    useEffect(() => {
        setReservations(
            [
                {
                    club: '들녘',
                    weekday: 'm',
                    startTime: 10,
                    endTime: 12,
                },
                {
                    club: '산틀',
                    weekday: 't',
                    startTime: 14,
                    endTime: 16,
                },
                {
                    club: '신명화랑',
                    weekday: 'w',
                    startTime: 11,
                    endTime: 13,
                },
                {
                    club: '악반',
                    weekday: 'th',
                    startTime: 15,
                    endTime: 17,
                },
                {
                    club: '들녘',
                    weekday: 'f',
                    startTime: 16,
                    endTime: 18,
                },
                {
                    club: '산틀',
                    weekday: 's',
                    startTime: 10,
                    endTime: 12,
                },
                {
                    club: '신명화랑',
                    weekday: 'su',
                    startTime: 13,
                    endTime: 15,
                },
                {
                    club: '악반',
                    weekday: 'm',
                    startTime: 17,
                    endTime: 19,
                },
                {
                    club: '들녘',
                    weekday: 't',
                    startTime: 18,
                    endTime: 20,
                },
                {
                    club: '신명화랑',
                    weekday: 'w',
                    startTime: 13,
                    endTime: 14,
                }
            ]
        );
    }, []);

    const weekdays_ko = ['월', '화', '수', '목', '금', '토', '일'];
    const weekdays_us = ['m', 't', 'w', 'th', 'f', 's', 'su'];
    const times = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const renderColor = { '산틀': 'bg-slate-400', '악반': 'bg-blue-400', '들녘': 'bg-red-400', '신명화랑': 'bg-green-400', '기타': 'bg-yellow-400' }
    return (
        <>
            <div className="text-lg font-medium ml-2 mt-2">정기 연습 관리</div>
            <div className="flex flex-row justify-center items-end gap-1">
                <div className="text-xl cursor-pointer"
                    onClick={() => setMonth(month - 1)}>◄</div>
                <div className="text-2xl w-12 text-center">
                    {`${month}월`}
                </div>
                <div className="text-xl cursor-pointer"
                    onClick={() => setMonth(month + 1)}>►</div>
            </div>
            <table className="border-collapse m-4">
                <thead>
                    <tr>
                        {weekdays_ko.map(weekday => (<th key={weekday} className="border border-gray-200 w-12 h-8">{weekday}</th>))}
                    </tr>
                    {times.map(time => {
                        const weeks: JSX.Element[] = [];
                        weekdays_us.map(weekday => {

                            // 여기서 매치된 리저베이션 확인
                            const matchedIndex = reservations.findIndex(
                                (res) => res.weekday === weekday && res.startTime <= time && res.endTime > time
                            );
                            const matchedReservation = matchedIndex !== -1 ? reservations[matchedIndex] : null;
                            const bgClass = matchedReservation ? renderColor[matchedReservation.club] : 'bg-white';
                            const borderOption = matchedReservation? '':'border border-gray-200 ';
                            weeks.push(
                                <th key={`${weekday}-${time}`} className={`w-12 h-24 ${bgClass} ${borderOption}`}>
                                    <div className={`w-full h-full flex flex-col`}>
                                        {matchedReservation && <div key={`${weekday}-${time}-r`} className='h-full w-full  px-1 py-1 text-white'>
                                            {time == matchedReservation.startTime && time == matchedReservation.endTime - 1 &&
                                                <div className='flex flex-col justify-between h-full'>
                                                    <div className=" font-semibold text-left">{matchedReservation.club}</div>
                                                    <div className="font-semibold text-right text-xs">{matchedReservation.startTime}:00 ~ {matchedReservation.endTime}:00</div>
                                                </div>
                                            }
                                            {time == matchedReservation.startTime && time != matchedReservation.endTime - 1 && (
                                                <div className=" font-semibold text-left">{matchedReservation.club}</div>
                                            )}
                                            {time == matchedReservation.endTime - 1 && time != matchedReservation.startTime && (
                                                <div className="flex flex-col justify-end h-full font-semibold text-right text-xs">{matchedReservation.startTime}:00 ~ {matchedReservation.endTime}:00</div>
                                            )}
                                        </div>}

                                    </div>
                                </th>)
                        }
                        )
                        return (
                            <tr key={time + '-row'}>
                                {weeks}
                            </tr>
                        )
                    })}
                </thead>
            </table>
        </>

    )
}