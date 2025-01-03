'use client'

import { useParams, useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useState } from "react";
import loadMonthlyReserves from "./utils";

export const Calendar: React.FC = () => {
    const { year_month, date } = useParams()
    const selectedDate = new Date(year_month + '-' + date)
    const router = useRouter();

    const [calendarYear, setYear] = useState(selectedDate ? selectedDate.getFullYear() : new Date().getFullYear())
    const [calendarMonth, setMonth] = useState(selectedDate ? selectedDate.getMonth() : new Date().getMonth())
    const [daysInMonth, setDaysInMonth] = useState<number[]>([]);
    const [reservedDates, setReservedDates] = useState<{ [key: number]: { participationAvailable: boolean, type: string, id: number }[] }>({});

    const prevDays = (day: number) => {
        if (day == 0) return 6;
        return day - 1;
    }

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
    }, [year_month])


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

        setDaysInMonth(daysArray);

        loading(calendarYear, calendarMonth);

    }, [calendarYear, calendarMonth]);



    const renderWeeks = () => {
        const weeks: any[] = [];
        let days: any[] = [];

        daysInMonth.forEach((day, index) => {
            if (day == 0) days.push(<div className="w-8 h-8" />)
            else {
                days.push(
                    <div key={`date-${day}`}
                        className={`w-8 my-0.5 cursor-pointer ${((day == selectedDate?.getDate()) && (calendarMonth == selectedDate?.getMonth())) ? 'rounded-md bg-blue-100' : ''}`}
                        onClick={() => { router.replace(`/reserve/live/${calendarYear}-${calendarMonth + 1}/${day}`) }}
                    >
                        <div className={`w-8 h-5 text-center text-base text-gray-400 ${((day == selectedDate?.getDate()) && (calendarMonth == selectedDate?.getMonth() + 1)) ? 'text-blue-500' : ''}`} >{day}</div>
                        <div className="mx-1 h-4 flex justify-center flex-row items-center gap-0.5">
                            {reservedDates[day] && reservedDates[day].slice(0, 3).map((reserve) => {

                                const color = reserve.type == '정기연습' ? 'bg-blue-500' : reserve.participationAvailable ? 'bg-green-500' : 'bg-red-500'
                                return (
                                    <div key={'reservationId'+reserve.id} className={"h-1.5 w-1.5 rounded-full " + color} />
                                )
                            })
                            }
                        </div>
                        {reservedDates[day]?.length > 3 && <div className="text-xs text-gray-500" >+{reservedDates[day].length - 3}</div>}
                    </div>
                );
            }

            if ((index + 1) % 7 === 0) {
                weeks.push(
                    <div key={'week' + (weeks.length + 1)} className="mx-4 justify-between flex flex-row text-center"
                        onClick={(e) => {
                            e.currentTarget.classList.add('rounded-md', 'bg-blue-100');

                        }}>
                        {days}
                    </div>
                );
                weeks.push(<div key={`space-${Math.ceil((index + 1) / 7)}`} className="h-2" />);
                days = [];
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