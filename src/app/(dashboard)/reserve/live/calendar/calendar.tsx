'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import loadMonthlyReserves from "./utils";
import { useDateStore } from "../zustand/date-store";

export const Calendar: React.FC = () => {

    const { selectedDate, selectDate } = useDateStore();

    const [selectedWeek, setSelectedWeek] = useState<number[]>([])
    const [calendarYear, setYear] = useState(selectedDate ? selectedDate.getFullYear() : new Date().getFullYear())
    const [calendarMonth, setMonth] = useState(selectedDate ? selectedDate.getMonth() : new Date().getMonth())
    const [daysInMonth, setDaysInMonth] = useState<number[]>([]);
    const [reservedDates, setReservedDates] = useState<{ [key: number]: { participationAvailable: boolean, reservationType: string, reservationId: number }[] }>({});

    const prevDays = (day: number) => {
        if (day == 0) return 6;
        return day - 1;
    }

    useEffect(() => {
        const utcTime = new Date();
        const koreanTime = new Date(utcTime.getTime() + 9 * 60 * 60 * 1000);
        const koreanDate = new Date(koreanTime.toISOString().split('T')[0] + 'T00:00Z')
        selectDate(koreanDate)
    }, [])
    // useEffect(() => {
    //     if (data) {
    //         const reservedDates: { [key: number]: ReserveType[] } = [];
    //         data.map((reserve) => {
    //             const reserveDate = reserve.date.getDate();
    //             if (!reservedDates[reserveDate]) reservedDates[reserveDate] = [reserve.type];
    //             else reservedDates[reserveDate] = [...reservedDates[reserveDate], reserve.type];
    //         })
    //         setReservedDates(reservedDates);
    //     }
    // }
    //     , [data])

    const loading = useCallback(async (calendarYear: number, calendarMonth: number) => {
        try {
            const response = await loadMonthlyReserves({ year: calendarYear, month: calendarMonth + 1 }) as { [key: number]: any[] }

            console.log(response)
            setReservedDates(response);
        } catch (e) {
            console.error(e);
        }
    }, [])


    const incrementMonth = useCallback((calendarYear: number, calendarMonth: number) => {
        const newDate = new Date(calendarYear, calendarMonth);
        newDate.setMonth(calendarMonth + 1);
        if (newDate.getFullYear() != calendarYear)
            setYear(newDate.getFullYear())
        setMonth(newDate.getMonth())
        setReservedDates([]);
    }, []
    );


    const decrementMonth = useCallback((calendarYear: number, calendarMonth: number) => {
        const newDate = new Date(calendarYear, calendarMonth);
        newDate.setMonth(calendarMonth - 1);
        if (newDate.getFullYear() != calendarYear)
            setYear(newDate.getFullYear())
        setMonth(newDate.getMonth());
        setReservedDates([]);
    }, [])

    useLayoutEffect(() => {
        const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
        const lastDayOfMonth = new Date(calendarYear, calendarMonth + 1, 0);

        const daysArray = [];
        for (let i = 0; i < prevDays(firstDayOfMonth.getDay()); i++) {
            daysArray.push(0);
        }

        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            daysArray.push(i);
        }

        while (daysArray.length % 7 !== 0) {
            daysArray.push(0);
        }

        const startOfWeek = selectedDate.getDate() - (selectedDate.getDate() % 7);
        const weekDays = daysArray.slice(startOfWeek, startOfWeek + 7).filter(d => d !== 0);
        setDaysInMonth(daysArray);
        setSelectedWeek(weekDays);

        loading(calendarYear, calendarMonth);

    }, [calendarYear, calendarMonth]);


    const renderWeeks = () => {
        const weeks: React.ReactNode[] = [];
        let days: React.ReactNode[] = [];
        let currentWeek: number[] = [];

        daysInMonth.forEach((day, index) => {
            if (day === 0) {
                days.push(<div className="w-8 h-8" key={`empty-${index}`} />);
            } else {
                days.push(
                    <div
                        key={`date-${day}`}
                        className={`w-8 cursor-pointer ${selectedDate.getDate() == day && selectedDate.getMonth() == calendarMonth && selectedDate.getFullYear() == calendarYear
                            && 'bg-blue-200 rounded'}`}
                        onClick={() => {
                            const d = new Date(calendarYear, calendarMonth, day, 0, 0, 0);
                            const startOfWeek = index - (index % 7);
                            const weekDays = daysInMonth.slice(startOfWeek, startOfWeek + 7).filter(d => d !== 0);
                            setSelectedWeek(weekDays);
                            selectDate(new Date(d.getTime() + 9 * 60 * 60 * 1000))
                        }}
                    >
                        <div
                            className={`w-8 h-5 text-center text-base ${selectedDate.getDate() == day && selectedDate.getMonth() == calendarMonth && selectedDate.getFullYear() == calendarYear
                                ? 'text-blue-400' : 'text-gray-400'}`}
                        >
                            {day}
                        </div>

                        <div className="mx-1 h-4 flex justify-center flex-row items-center gap-0.5">
                            {reservedDates[day] &&
                                reservedDates[day].slice(0, 3).map((reservation) => {
                                    // bg-blue-500 bg-gray-500 bg-green-500 bg-red-500

                                    const color =
                                        reservation.reservationType === 'REGULAR' ?
                                            'bg-blue-500'
                                            :
                                            reservation.reservationType == 'EXTERNAL' ?
                                                'bg-gray-500'
                                                :
                                                reservation.participationAvailable ?
                                                    'bg-green-500'
                                                    :
                                                    'bg-red-500';

                                    console.log(day,color)
                                    return (
                                        <div
                                            key={`reservationId-${reservation.reservationId}`}
                                            className={`h-1.5 w-1.5 rounded-full ${color}`}
                                        />
                                    );
                                })}
                        </div>
                        {reservedDates[day]?.length > 3 && (
                            <div className="text-xs text-gray-500">+{reservedDates[day].length - 3}</div>
                        )}
                    </div>
                );
                currentWeek.push(day);
            }

            if ((index + 1) % 7 === 0) {
                const isSelectedWeek = selectedWeek.some((date) => currentWeek.includes(date));
                weeks.push(
                    <div
                        key={`week-${weeks.length + 1}`}
                        className={`mx-4 my-1 justify-between flex flex-row text-center 
                            ${isSelectedWeek && selectedDate.getMonth() == calendarMonth && selectedDate.getFullYear() == calendarYear ? 'rounded-md bg-blue-100' : ''
                            }`}
                    >
                        {days}
                    </div>
                );
                weeks.push(<div key={`space-${weeks.length + 1}`} className="h-2" />);
                days = [];
                currentWeek = [];
            }
        });

        return weeks;
    };

    return (
        <div>
            <div className="text-center text-gray-400">
                {`${calendarYear}년`}
            </div>
            <div className="flex flex-row justify-center gap-2">
                <div className="text-lg cursor-pointer"
                    onClick={() => decrementMonth(calendarYear, calendarMonth)}>◄</div>
                <div className="text-lg">
                    {`${calendarMonth + 1}월`}
                </div>
                <div className="text-lg cursor-pointer"
                    onClick={() => incrementMonth(calendarYear, calendarMonth)}>►</div>
            </div>
            <div>
                <div className="mx-4 justify-between flex flex-row">
                    <div className="w-8 h-8 text-center text-stone-400 text-lg">월</div>
                    <div className="w-8 h-8 text-center text-stone-400 text-lg">화</div>
                    <div className="w-8 h-8 text-center text-stone-400 text-lg">수</div>
                    <div className="w-8 h-8 text-center text-stone-400 text-lg">목</div>
                    <div className="w-8 h-8 text-center text-stone-400 text-lg">금</div>
                    <div className="w-8 h-8 text-center text-stone-400 text-lg">토</div>
                    <div className="w-8 h-8 text-center text-stone-400 text-lg">일</div>
                </div>
                {renderWeeks()}
                <div className="h-2" />
            </div>
        </div>
    );
}