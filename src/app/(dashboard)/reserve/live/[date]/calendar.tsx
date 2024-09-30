'use client'
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import loadMonthlyReserves from "../calendar/utils";

type ReserveType = 'regular' | 'personal' | 'none';

export const Calendar: React.FC<{ calendarDate?: Date }> = ({ calendarDate }) => {
    const router = useRouter();
    const [calendarYear, setYear] = useState(calendarDate ? calendarDate.getFullYear() : new Date().getFullYear())
    const [calendarMonth, setMonth] = useState(calendarDate ? calendarDate.getMonth() : new Date().getMonth())
    const [daysInMonth, setDaysInMonth] = useState<number[]>([]);
    const [reservedDates, setReservedDates] = useState<{ [key: number]: ReserveType[] }>({});

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

        const loading = async () => {
            try {
                const response = await loadMonthlyReserves({ year: calendarYear, month: calendarMonth + 1 }) as { [key: number]: ReserveType[] }

                setReservedDates(response)
            } catch (e) {
                console.error(e);
            }
        }

        loading();
        
    }, [calendarMonth, calendarYear]);


    const incrementMonth = () => {
        const newDate = new Date(calendarYear, calendarMonth + 1);
        newDate.setMonth(calendarMonth + 1);
        if (newDate.getFullYear() != calendarYear)
            setYear(newDate.getFullYear())
        setMonth(newDate.getMonth());
    };

    const decrementMonth = () => {
        const newDate = new Date(calendarYear, calendarMonth);
        newDate.setMonth(calendarMonth - 1);
        if (newDate.getFullYear() != calendarYear)
            setYear(newDate.getFullYear())
        setMonth(newDate.getMonth());
    };

    const renderWeeks = () => {
        const weeks: any[] = [];
        let days: any[] = [];

        daysInMonth.forEach((day, index) => {
            if (day == 0) days.push(<div className="w-8 h-8" />)
            else {
                days.push(
                    <div key={`date-${day}`}
                        className={`w-8 h-8 cursor-pointer ${((day == calendarDate?.getDate()) && (calendarMonth == calendarDate?.getMonth())) ? 'rounded-md bg-blue-100' : ''}`}
                        onClick={() => router.replace(`/reserve/live/${calendarYear}-${calendarMonth + 1}-${day}`)}
                    >
                        <div className={`w-7 text-center text-base text-gray-400 mx-0.5 ${((day == calendarDate?.getDate()) && (calendarMonth == calendarDate?.getMonth())) ? 'text-blue-500' : ''}`} >{day}</div>
                        <div className="mx-1 h-4 flex-col-reverse mt-1">
                            {reservedDates[day] && reservedDates[day].slice(0, 3).map((type) => {
                                const color = type == 'regular' ? 'text-blue-500' : type == 'none' ? 'text-red-500' : 'text-green-500'
                                return (
                                    <div className={"h-1 w-7 rounded-md mt-0.5" + color} />
                                )
                            })
                            }
                        </div>
                        {reservedDates[day]?.length > 3 && <div className="text-xs text-gray-300 mt-0.5" >+{reservedDates[day].length - 3}</div>}
                    </div>
                );
            }

            if ((index + 1) % 7 === 0) {
                weeks.push(
                    <div key={'day-' + index} className="mx-4 justify-between flex flex-row text-center">
                        {days}
                    </div>
                );
                weeks.push(<div key={`space-${index}`} className="h-2" />);
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
                    onClick={decrementMonth}>◄</div>
                <div className="text-lg">
                    {`${calendarMonth + 1}월`}
                </div>
                <div className="text-lg cursor-pointer"
                    onClick={incrementMonth}>►</div>
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