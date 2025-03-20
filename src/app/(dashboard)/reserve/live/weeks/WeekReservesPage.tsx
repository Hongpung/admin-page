'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '@admin/app/(dashboard)/modal';
import addBatchReservation, { batchReservationOptions, createReservation, deleteReservation, editReservation, loadDailyOccupiedTimes, loadDailyReservations, loadReservationDetail, loadWeeklyReservatiosn as loadWeeklyReservations, ReservationType, searchMembers } from './utils';

import { debounce } from 'lodash';
import { useDateStore } from '../zustand/date-store';
import { josa } from 'es-hangul';
import ReactDOM from 'react-dom';


interface dateReservation {
    amountOfParticipators: number;
    reservationId: number;
    creatorName: string;
    creatorNickname: string;
    date: string;
    startTime: TimeFormat;
    endTime: TimeFormat;
    title: string;
    reservationType: reservationType;
    participationAvailable: boolean;
}


type reservationType = 'COMMON' | 'REGULAR' | 'EXTERNAL'



// reservationId: reservation.reservationId,
//         title,
//         reservationType,
//         participationAvailable,
//         creatorId: creator.memberId,
//         creatorName: creator.name,
//         creatorNickname: creator.nickname,
//         date: reservation.date.toISOString().split('T')[0],      // 날짜만 반환
//         startTime: this.timeFormmaForClient(reservation.startTime),
//         endTime: this.timeFormmaForClient(reservation.endTime),

interface NewReservation {
    creatorId?: number;
    creatorName?: string;
    date?: string;                       // 예약 날짜 (YYYY-MM-DD 형식)
    reservationType: reservationType;                       // 예약 유형
    startTime?: TimeFormat;                  // 시작 시간 (HH:MM:SS 형식)
    endTime?: TimeFormat;                    // 종료 시간 (HH:MM:SS 형식)
    title?: string;                    // 예약 메시지
    participationAvailable: boolean;    // 참여 가능 여부
}

interface EditReservation {
    reservationId: number;
    creatorId?: number;
    creatorName?: string;
    date: string;                       // 예약 날짜 (YYYY-MM-DD 형식)
    reservationType: reservationType;                       // 예약 유형
    startTime?: TimeFormat;                  // 시작 시간 (HH:MM:SS 형식)
    endTime?: TimeFormat;                    // 종료 시간 (HH:MM:SS 형식)
    title: string;                    // 예약 메시지
    participationAvailable: boolean;    // 참여 가능 여부
}

const renderColor = [
    '[#93c5fd]',
    '[#ffaaaa]',
    '[#86efac]',
    '[#fef08a]',
    '[#bef264]',
    '[#d1d5db]',
    '[#c084fc]',
    '[#fecdd3]'
] as const;

// bg-[#93c5fd] border-t-[#93c5fd] border-b-[#93c5fd]
// bg-[#ffaaaa] border-t-[#ffaaaa] border-b-[#ffaaaa]
// bg-[#86efac] border-t-[#86efac] border-b-[#86efac]
// bg-[#fef08a] border-t-[#fef08a] border-b-[#fef08a]
// bg-[#bef264] border-t-[#bef264] border-b-[#bef264]
// bg-[#d1d5db] border-t-[#d1d5db] border-b-[#d1d5db]
// bg-[#c084fc] border-t-[#c084fc] border-b-[#c084fc]
// bg-[#fecdd3] border-t-[#fecdd3] border-b-[#fecdd3]

type ColorFormat = typeof renderColor[number];

const weekdays_ko = ['월', '화', '수', '목', '금', '토', '일'] as const;

type WeekDay = typeof weekdays_ko[number];

const RBButton: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isClient, setIsClient] = useState(false);
    const [panelVisible, setPanelVisible] = useState(false)

    useEffect(() => {
        // 클라이언트 측에서만 document 사용 가능
        setIsClient(true);

    }, []);

    if (!isClient) return null;


    return ReactDOM.createPortal(
        <div className='relative'>
            <div className='absolute h-full -right-12 flex flex-col-reverse items-end'>
                <div className={`sticky bottom-12 mb-6 flex w-12 h-12 rounded-full text-3xl text-white justify-center items-center z-50 cursor-pointer transform transition-[transform, colors] duration-500 ease-in-out ${panelVisible ? "rotate-45 bg-black " : "rotate-0 bg-gray-400 "}`}
                    onClick={() => setPanelVisible(prev => !prev)}>
                    +
                </div>
                {panelVisible &&
                    <div className='sticky z-50 bottom-28 '>
                        {children}
                    </div>}
            </div>
        </div>
        ,
        document.getElementsByTagName('main')[0] // 클라이언트에서만 `document`를 사용할 수 있음
    );
};

export default function WeekReservesPage() {

    const { selectedDate } = useDateStore()

    const [editReservationId, setEditReservationId] = useState<number | null>(null)
    const [modalState, setModalState] = useState<'Create' | 'CreateBatch' | 'Edit' | 'None'>('None')
    const [monday, setMonday] = useState<string>(getMonday(selectedDate).toISOString().split('T')[0]);
    const [sunday, setSunday] = useState<string>(getSunday(selectedDate).toISOString().split('T')[0]);

    console.log('this time is' + selectedDate, sunday, monday)

    const [weekDates, setWeekDates] = useState<string[]>([])
    const [weeklyReservations, setWeeklyReservations] = useState<{ [day: string]: { [time: string]: { reservation: dateReservation, isStart: boolean, isEnd: boolean, color: ColorFormat } } }>({})

    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'] as const;

    const hourlySlots = [
        '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00'
    ] as const;

    const addThirtyMinutes = (time: TimeFormat): TimeFormat => {
        const timeIndex = TimeArray.findIndex((t) => t == time);
        return TimeArray[timeIndex + 1] ?? '22:00';
    };

    /**
     * 주어진 날짜의 해당 주 월요일을 반환합니다.
     * @param {Date} date - 기준 날짜
     * @returns {Date} - 해당 주의 월요일
     */
    function getMonday(date: Date): Date {
        const d = new Date(date.getTime() + 9 * 60 * 60 * 1000);
        const day = d.getDay(); // 0 (일요일)부터 6 (토요일)
        const diff = (day === 0 ? -6 : 1 - day); // 월요일로의 차이 계산
        d.setDate(d.getDate() + diff);
        return d;
    }

    /**
     * 주어진 날짜의 해당 주 일요일을 반환합니다.
     * @param {Date} date - 기준 날짜
     * @returns {Date} - 해당 주의 일요일
     */
    function getSunday(date: Date): Date {
        const d = new Date(date.getTime() + 9 * 60 * 60 * 1000);
        const day = d.getDay(); // 0 (일요일)부터 6 (토요일)
        const diff = (day === 0 ? 0 : 7 - day)  // 일요일로의 차이 계산
        d.setDate(d.getDate() + diff);
        return d;
    }

    function getWeekDates(date: Date): string[] {
        const selectedDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
        const day = selectedDate.getDay(); // 0 (일요일)부터 6 (토요일)
        const diff = (day === 0 ? -6 : 1 - day); // 월요일로의 차이 계산
        selectedDate.setDate(selectedDate.getDate() + diff);
        const weekDates: string[] = [];

        for (let i = 0; i < 7; i++) {
            const current = new Date(selectedDate);
            current.setDate(selectedDate.getDate() + i);
            const month = String(current.getMonth() + 1);
            const day = String(current.getDate());
            weekDates.push(`${month}/${day}`);
        }

        return weekDates;
    }

    useEffect(() => {
        const fetchDailyReserve = async () => {
            const weeklyReserves: dateReservation[] = await loadWeeklyReservations(monday, sunday)
            console.log(sunday, monday, weeklyReservations, weeklyReserves)

            const parsedDate = new Date(new Date(selectedDate.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00Z');
            setWeekDates(getWeekDates(parsedDate))
            const formmatingReservations = formattingReservationsForTable(weeklyReserves);
            setWeeklyReservations(formmatingReservations)
        }
        if (modalState == 'None')
            fetchDailyReserve();
    }, [modalState, sunday, monday])

    useEffect(() => {

        const newMonday = getMonday(selectedDate).toISOString().split('T')[0];
        const newSunday = getSunday(selectedDate).toISOString().split('T')[0];

        setMonday(newMonday);
        setSunday(newSunday);

    }, [selectedDate])

    const formattingReservationsForTable = (reservations: dateReservation[]) => {

        const reservationMap: { [day: string]: { [time: string]: { reservation: dateReservation, isStart: boolean, isEnd: boolean, color: ColorFormat } } } = {};

        if (reservations.length == 0) return {};

        reservations.map((reservation, idx) => {
            console.log(reservation)
            const startIndex = TimeArray.indexOf(reservation.startTime);
            const endIndex = TimeArray.indexOf(reservation.endTime);

            if (startIndex == -1 || endIndex == -1) return;

            const selectedRange = TimeArray.slice(startIndex, endIndex);
            const weekday = daysOfWeek[new Date(reservation.date + 'T00:00Z').getDay()]

            selectedRange.map((time, index) => {
                if (!reservationMap[weekday]) {
                    reservationMap[weekday] = {};
                }

                reservationMap[weekday][time] = { reservation, isStart: index == 0, isEnd: index == selectedRange.length - 1, color: renderColor[idx % 8] };
            })
        })

        return reservationMap
    }

    return (
        <>
            <RBButton>
                {<div className='flex flex-col w-48 px-4 py-2 bg-white bottom-14 shadow-xl rounded-md '>
                    <div className='font-semibold py-2 cursor-pointer' onClick={() => setModalState('Create')}>새 예약 생성</div>
                    <div className='font-semibold py-2 cursor-pointer' onClick={() => setModalState('CreateBatch')}>정기 예약 일정 생성</div>
                </div>}
            </RBButton>
            {/* <div className="text-gray-400 font-medium mx-2">
                {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 {daysOfWeek[selectedDate.getDay()]}요일
            </div> */}

            <div className="h-full w-full flex flex-row gap-2">
                <div className='flex flex-col mt-14 flex-0 h-full gap-16'>
                    {[...hourlySlots].map(hour => (
                        <div className='text-gray-300 h-8 flex flex-col justify-center'>{hour}</div>
                    ))}
                </div>
                <table className="flex-grow border-collapse table-fixed">
                    <thead>
                        <tr>
                            {weekdays_ko.map((weekday, index) => (<th key={weekday} className={`border w-32 h-8 py-2 ${selectedDate.getDay() == daysOfWeek.findIndex(day_ko => day_ko == weekday) ? 'bg-blue-50' : ''}`}>
                                <div className='flex flex-col'>
                                    <div>{weekDates[index]}</div>
                                    <div>({weekday})</div>
                                </div>
                            </th>))}
                        </tr>
                    </thead>
                    <tbody>
                        {hourlySlots.map(hour => {
                            const firstHalf = hour; // 예: '10:00'
                            const secondHalf = addThirtyMinutes(hour) as TimeFormat; // 예: '10:30'
                            return (
                                <tr key={hour} className='h-24'>
                                    {weekdays_ko.map(day => {
                                        const reservationFirst = weeklyReservations[day]?.[firstHalf] || undefined;
                                        const reservationSecond = weeklyReservations[day]?.[secondHalf] || undefined;

                                        return (
                                            <td key={`${day}-${hour}`}
                                                className={`border-l border-r p-0 h-full w-32 ${selectedDate.getDay() == daysOfWeek.findIndex(day_ko => day_ko == day) ? 'bg-blue-50' : ''} ${reservationSecond ? reservationSecond.isEnd ? 'border-b ' : `border-b border-b-${reservationSecond.color}` : 'border-b'} ${reservationFirst ? reservationFirst.isStart ? 'border-t' : `border-t border-t-${reservationFirst.color}` : 'border-t'}`}
                                            >
                                                {reservationFirst ?
                                                    <div
                                                        key={reservationFirst.reservation.reservationId + firstHalf}
                                                        className={`h-12 w-full px-2 py-2 flex flex-col bg-${reservationFirst.color} cursor-pointer ${reservationFirst.isEnd ? 'border-b' : ''}`}
                                                        onClick={() => { setModalState('Edit'); setEditReservationId(reservationFirst.reservation.reservationId) }}
                                                    >
                                                        {reservationFirst.isStart && <div className='flex flex-col justify-start font-semibold text-xs'>{reservationFirst.reservation.title}</div>}
                                                        {reservationFirst.isEnd && <div className='flex flex-col h-full items-end justify-end gap-1 text-xs font-semibold'>
                                                            <div>{reservationFirst.reservation.creatorName}</div>
                                                            <div>{reservationFirst.reservation.startTime}~{reservationFirst.reservation.endTime}</div>
                                                        </div>}
                                                    </div>
                                                    :
                                                    <div className={`h-12 w-full flex flex-col`}>
                                                    </div>
                                                }
                                                {reservationSecond ?
                                                    <div
                                                        key={reservationSecond.reservation.reservationId + secondHalf}
                                                        className={`h-12 w-full px-2 py-2 flex flex-col  bg-${reservationSecond.color} cursor-pointer  ${reservationSecond.isStart ? 'border-t' : ''}`}
                                                        onClick={() => { setModalState('Edit'); setEditReservationId(reservationSecond.reservation.reservationId) }}
                                                    >
                                                        {reservationSecond.isStart && <div className='flex flex-col justify-start font-semibold text-xs'>
                                                            {reservationSecond.reservation.title}
                                                        </div>}
                                                        {reservationSecond.isEnd && <div className='flex flex-col h-full items-end justify-end gap-1 text-xs font-semibold'>
                                                            <div className=''>{reservationSecond.reservation.creatorName}</div>
                                                            <div className=''>{reservationSecond.reservation.startTime}~{reservationSecond.reservation.endTime}</div>
                                                        </div>}
                                                    </div>
                                                    :
                                                    <div className={`h-12 w-full flex flex-col`}>
                                                    </div>
                                                }
                                            </td>
                                        )
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {modalState == 'CreateBatch' && <BatchAddModal onClose={() => setModalState('None')} isOpen={modalState == 'CreateBatch'} />}
            {modalState == 'Create' && <CreateReservationModal onClose={() => setModalState('None')} visible={modalState == 'Create'} />}
            {modalState == 'Edit' && editReservationId && <EditReservationModal onClose={() => setModalState('None')} reservationId={editReservationId} visible={modalState == 'Edit' && !!editReservationId} />}

        </>
    )
}

const TimeArray = [
    '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30',
    '22:00'
] as const;

interface ExistReservation {
    reservationId: number;
    creatorName: string;
    startTime: TimeFormat;
    endTime: TimeFormat;
    title: string;
    reservationType: 'REGULAR' | 'COMMON' | 'EXTERNAL';
}


interface OccupiedReservation extends ExistReservation {
    range: TimeFormat[]
}

type TimeFormat = typeof TimeArray[number];

function CreateReservationModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {

    const [modalState, setModalState] = useState<'None' | 'Creator'>('None')
    const [occupiedTimes, setOccupiedTimes] = useState<TimeFormat[] | null>(null)
    const [newReservation, setNewReservation] = useState<NewReservation>({
        reservationType: 'COMMON',
        participationAvailable: true,
    })
    const [existReservations, setExistReservations] = useState<OccupiedReservation[] | null>(null)

    const tryCreateReservation = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const title = formData.get('practice-name') as string;
        const { date, startTime, endTime, reservationType: type, participationAvailable, creatorId } = newReservation;

        // 공통 필드를 가진 reservationForm 생성
        const reservationForm: any = {
            title,
            date,
            startTime,
            endTime,
            reservationType: type,          // 백엔드에 넘길 때 프로퍼티 이름에 맞춰 사용
            participationAvailable,
        };
        if (newReservation.reservationType == 'EXTERNAL') {
            const externalCreatorName = formData.get('external-username') as string;

            reservationForm.externalCreatorName = externalCreatorName

        }
        else if (creatorId) {
            reservationForm.creatorId = creatorId;
        }
        else {
            alert('예약자를 선택하세요')
            return;
        }

        try {
            console.log(reservationForm)
            const response = await createReservation(reservationForm)

            alert(response.message)

            onClose()

            setNewReservation({
                reservationType: 'COMMON',
                participationAvailable: true,
            });
        } catch {
            alert('실패')
        }
    }

    const isConflict = useCallback((start: TimeFormat, end: TimeFormat) => {
        const startIndex = TimeArray.indexOf(start);
        const endIndex = TimeArray.indexOf(end);
        if (startIndex < 0 || endIndex < 0) return null;

        // 시작/종료 역전될 수 있으므로 min/max 처리
        const lower = Math.min(startIndex, endIndex);
        const upper = Math.max(startIndex, endIndex);

        // slice(lower, upper+1) => lower부터 upper까지의 모든 시간을 배열로 추출
        const selectedRange = TimeArray.slice(lower, upper);

        const overllapedReservations = existReservations?.filter(reservation =>
            selectedRange.some(time => reservation.range?.includes(time))
        );
        return overllapedReservations ?? null
    }, [occupiedTimes])

    const formattingOccupiedTimes = (reservations: ExistReservation[]) => {

        const oTimes: TimeFormat[] = [];
        const eReservations: OccupiedReservation[] = [];
        reservations.map(({ startTime, endTime, ...reservation }) => {
            const startIndex = TimeArray.indexOf(startTime);
            const endIndex = TimeArray.indexOf(endTime);

            const selectedRange = TimeArray.slice(startIndex, endIndex);

            const reservationInformation = {
                range: selectedRange,
                startTime,
                endTime,
                ...reservation
            }
            oTimes.push(...selectedRange)
            eReservations.push(reservationInformation)
        })
        setOccupiedTimes(oTimes)
        setExistReservations(eReservations)
    }

    useEffect(() => {
        const loadOccupideTimes = async () => {
            try {
                const fetchReservations =
                    await loadDailyOccupiedTimes(new Date(newReservation.date || '')) as ExistReservation[]
                // loadedOccupiedTimes 포맷

                formattingOccupiedTimes(fetchReservations);
                setNewReservation(prev => ({ ...prev, startTime: undefined, endTime: undefined }))
            } catch {
                alert('로드 실패')
            }
        }

        console.log(newReservation.date, 2222)
        if (!!newReservation.date)
            loadOccupideTimes()

    }, [newReservation.date])

    return (
        <Modal isOpen={visible}>
            {modalState == 'Creator' && <CreatorSelectModal onClose={() => setModalState('None')} visible={modalState == 'Creator'} creatorId={newReservation.creatorId} setCreator={(user) => setNewReservation(prev => ({ ...prev, creatorId: user.userId, creatorName: user.userName }))} />}
            <div className='font-bold text-lg'>예약 생성</div>
            <form className='flex flex-col'
                onSubmit={tryCreateReservation}>
                <div className='flex flex-col gap-6 mx-4 mt-6 mb-12'>

                    <div className='flex-row flex justify-between items-center'>
                        외부 예약
                        <div className='flex flex-row gap-2 items-center'>{newReservation.reservationType == 'EXTERNAL' ? '예' : '아니오'}
                            <input type="checkbox" id="switch" name="switch"
                                className="hidden peer"
                                checked={newReservation.reservationType == 'EXTERNAL'}
                                onChange={(e) => {
                                    if (e.currentTarget.checked) setNewReservation(prev => ({ ...prev, reservationType: 'EXTERNAL' }));
                                    else setNewReservation(prev => ({ ...prev, reservationType: 'COMMON' }));
                                }}
                            />
                            <label htmlFor="switch" className="w-16 h-9 border-2 border-[#242020] rounded-full bg-white peer-checked:bg-black block relative cursor-pointer transition-colors duration-200">
                                <div className="z-10 top-0.5 left-0.5 w-6 h-6 bg-black rounded-full transition-transform duration-200 peer-checked:translate-x-7 peer-checked:bg-white"></div>
                            </label>
                        </div>
                    </div>
                    {newReservation.reservationType != 'EXTERNAL' ?
                        <div className='flex-row flex justify-between items-center'>
                            예약자
                            {newReservation.creatorId ?
                                <div className='flex flex-row gap-2 items-center'>
                                    {newReservation.creatorName}
                                    <div className='px-2 py-1 rounded-md bg-[#dddddd] cursor-pointer'
                                        onClick={() => setModalState('Creator')}>
                                        변경
                                    </div>
                                </div>
                                : <div className='px-2 py-1 rounded-md bg-[#dddddd] cursor-pointer'
                                    onClick={() => setModalState('Creator')}>
                                    멤버 선택
                                </div>}
                        </div> :
                        <div className='flex-row flex justify-between items-center'>
                            외부 예약자
                            <input required name='external-username' placeholder='외부 예약자 입력' className='w-64 text-lg text-right px-2 outline-none border-b border-gray-700' />
                        </div>}
                    <div className='flex-row flex justify-between'>
                        날짜
                        <input name='reserveDate' type="date" value={newReservation.date || ''} onChange={(e) => {
                            const selectedDate = e.currentTarget.value;
                            if (!!selectedDate)
                                setNewReservation(prev => ({ ...prev, date: selectedDate }))
                        }} required />
                    </div>
                    <div className='flex-row flex justify-between items-center'>
                        연습 시간
                        <div className='flex flex-row gap-4'>
                            <div className='w-24'>
                                <select className='w-full' name="startTime" id="startTime" value={newReservation.startTime || 'default'}
                                    onChange={(e) => {
                                        const newStartTime = e.currentTarget.value as TimeFormat;
                                        if (occupiedTimes?.includes(newStartTime)) {
                                            if (!confirm('예약시간이 중복되는 예약이 있습니다\n그대로 진행하시겠습니까?')) {
                                                e.preventDefault();
                                                return;
                                            }
                                        } else if (newReservation.endTime) {
                                            const conflictReservations = isConflict(newStartTime, newReservation.endTime)

                                            if (!!conflictReservations && conflictReservations.length > 0) {
                                                if (!confirm(`이미 예약된 시간이 포함되어 있습니다.(${conflictReservations.length})\n\n${conflictReservations.map(reservation => `${reservation.title} / ${reservation.creatorName} / ${reservation.startTime}~${reservation.endTime}\n`)}\n그대로 진행하시겠습니까?`)) {
                                                    e.preventDefault();
                                                    return;
                                                }
                                            }
                                        }
                                        setNewReservation(prev => ({ ...prev, startTime: newStartTime }))
                                    }}>
                                    <option disabled value={'default'}>시작 시간</option>
                                    {newReservation.date ? TimeArray.filter((_, index) => index < TimeArray.indexOf(newReservation.endTime || '22:00')).map(time => (
                                        <option key={'start-' + time} value={time}
                                            className={`w-full ${occupiedTimes?.includes(time) ? 'text-gray-400' : ''}`}
                                        >
                                            {time}
                                        </option>
                                    ))
                                        :
                                        <option disabled className='w-full text-gray-400'>날짜를 선택</option>}
                                </select>
                            </div>
                            ~
                            <div className='w-24'>
                                <select className='w-full' name="endTime" id="endTime" value={newReservation.endTime || 'default'}
                                    onChange={(e) => {
                                        const newEndTime = e.currentTarget.value as TimeFormat;
                                        if (occupiedTimes?.includes(newEndTime)) {
                                            if (!confirm('중복되는 예약이 있습니다\n그대로 진행하시겠습니까?')) {
                                                e.preventDefault();
                                                return;
                                            }
                                        } else if (newReservation.startTime) {
                                            const conflictReservations = isConflict(newReservation.startTime, newEndTime)
                                            if (!!conflictReservations && conflictReservations.length > 0) {
                                                if (!confirm(`이미 예약된 시간이 포함되어 있습니다.(${conflictReservations.length})\n\n${conflictReservations.map(reservation => `${reservation.title} / ${reservation.creatorName} / ${reservation.startTime}~${reservation.endTime}\n`)}\n그대로 진행하시겠습니까?`)) {
                                                    e.preventDefault();
                                                    return;
                                                }
                                            }
                                        }
                                        setNewReservation(prev => ({ ...prev, endTime: newEndTime }))
                                    }}>
                                    <option disabled value={'default'}>종료 시간</option>
                                    {newReservation.date ? TimeArray.filter((_, index) => index > TimeArray.indexOf(newReservation.startTime || '10:00')).map(time => (
                                        <option key={'end-' + time} value={time} className={`w-full ${occupiedTimes?.includes(time) ? 'text-gray-400' : ''}`}>{time}</option>
                                    ))
                                        :
                                        <option disabled className='w-full text-gray-400'>날짜를 선택</option>}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className='flex-row flex justify-between'>
                        연습 내용
                        <input required name='practice-name' className='w-64 text-lg text-right px-2 outline-none border-b border-gray-700' />
                    </div>
                    {newReservation.reservationType != 'EXTERNAL' && <div className='flex-row flex justify-between items-center'>
                        정규 연습
                        <div className='flex flex-row gap-2 items-center'>{newReservation.reservationType == 'REGULAR' ? '예' : '아니오'}
                            <input type="checkbox" id="reservationType" name="reservationType" className="hidden peer"
                                onChange={(e) => {
                                    if (e.currentTarget.checked) setNewReservation(prev => ({ ...prev, reservationType: 'REGULAR' }));
                                    else setNewReservation(prev => ({ ...prev, reservationType: 'COMMON' }));
                                }}
                                checked={newReservation.reservationType == 'REGULAR'}
                            />
                            <label htmlFor="reservationType" className="w-16 h-9 border-2 border-[#242020] rounded-full bg-white peer-checked:bg-black block relative cursor-pointer transition-colors duration-200">
                                <div className="z-10 top-0.5 left-0.5 w-6 h-6 bg-black rounded-full transition-transform duration-200 peer-checked:translate-x-7 peer-checked:bg-white"></div>
                            </label>
                        </div>
                    </div>}
                    <div className='flex-row flex justify-between'>
                        열린 연습
                        <div className='flex flex-row gap-2 items-center'>{newReservation.participationAvailable ? '예' : '아니오'}
                            <input type="checkbox" id="participationAvailable" name="participationAvailable" className="hidden peer"
                                onChange={(e) => {
                                    if (e.currentTarget.checked) setNewReservation(prev => ({ ...prev, participationAvailable: true }));
                                    else setNewReservation(prev => ({ ...prev, participationAvailable: false }));
                                }}
                                checked={newReservation.participationAvailable} />
                            <label htmlFor="participationAvailable" className="w-16 h-9 border-2 border-[#242020] rounded-full bg-white peer-checked:bg-black block relative cursor-pointer transition-colors duration-200">
                                <div className="z-10 top-0.5 left-0.5 w-6 h-6 bg-black rounded-full transition-transform duration-200 peer-checked:translate-x-7 peer-checked:bg-white"></div>
                            </label>
                        </div>
                    </div>

                </div>
                <div className='flex-row flex justify-between'>
                    <div
                        onClick={() => {
                            onClose();
                            setNewReservation({
                                reservationType: 'COMMON',
                                participationAvailable: true,
                            });
                        }}
                        className='border border-gray-200 px-4 py-2 rounded-md text-gray-500 cursor-pointer'>닫기</div>
                    <button type='submit' className='bg-blue-400 px-4 py-2 rounded-md text-white cursor-pointer'>생성</button>
                </div>
            </form>
        </Modal>
    )
}

function EditReservationModal({ visible, reservationId, onClose }: { visible: boolean, reservationId: number, onClose: () => void }) {

    const [modalState, setModalState] = useState<'None' | 'Creator'>('None')
    const [occupiedTimes, setOccupiedTimes] = useState<TimeFormat[] | null>(null)
    const [existReservations, setExistReservations] = useState<OccupiedReservation[] | null>(null)
    const [editedReservation, setEditReservation] = useState<EditReservation>({
        reservationId,
        date: '',
        participationAvailable: false,
        title: '',
        reservationType: 'COMMON',
    })

    const tryEditReservation = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const title = formData.get('practice-name') as string;
        const { date, startTime, endTime, reservationType: type, participationAvailable, creatorId } = editedReservation;

        // 공통 필드를 가진 reservationForm 생성
        const reservationForm: any = {
            title,
            date,
            startTime,
            endTime,
            reservationType: type,          // 백엔드에 넘길 때 프로퍼티 이름에 맞춰 사용
            participationAvailable,
        };
        if (editedReservation.reservationType == 'EXTERNAL') {
            const externalCreatorName = formData.get('external-username') as string;

            reservationForm.externalCreatorName = externalCreatorName

        }
        else if (creatorId) {
            reservationForm.creatorId = creatorId;
        }
        else {
            alert('예약자를 선택하세요')
            return;
        }

        try {
            console.log(reservationForm)
            const response = await editReservation(reservationId, reservationForm)

            alert(response.message)
            onClose()
        } catch {
            alert('실패')
        }

    }

    const isConflict = useCallback((start: TimeFormat, end: TimeFormat) => {
        const startIndex = TimeArray.indexOf(start);
        const endIndex = TimeArray.indexOf(end);
        if (startIndex < 0 || endIndex < 0) return null;

        // 시작/종료 역전될 수 있으므로 min/max 처리
        const lower = Math.min(startIndex, endIndex);
        const upper = Math.max(startIndex, endIndex);

        // slice(lower, upper+1) => lower부터 upper까지의 모든 시간을 배열로 추출
        const selectedRange = TimeArray.slice(lower, upper);

        const overllapedReservations = existReservations?.filter(reservation =>
            selectedRange.some(time => (reservation.reservationId != reservationId && reservation.range?.includes(time)))
        );
        return overllapedReservations ?? null
    }, [occupiedTimes])

    const formattingOccupiedTimes = (reservations: ExistReservation[]) => {

        const oTimes: TimeFormat[] = [];
        const eReservations: OccupiedReservation[] = [];
        reservations.map(({ startTime, endTime, ...reservation }) => {
            if (reservation.reservationId == reservationId) return;
            const startIndex = TimeArray.indexOf(startTime);
            const endIndex = TimeArray.indexOf(endTime);

            const selectedRange = TimeArray.slice(startIndex, endIndex);

            const reservationInformation = {
                range: selectedRange,
                startTime,
                endTime,
                ...reservation
            }
            oTimes.push(...selectedRange)
            eReservations.push(reservationInformation)
        })
        setOccupiedTimes(oTimes)
        setExistReservations(eReservations)
    }

    useEffect(() => {
        const loadOccupideTimes = async () => {
            try {
                const fetchReservations =
                    await loadDailyOccupiedTimes(new Date(editedReservation.date || '')) as ExistReservation[]
                // loadedOccupiedTimes 포맷

                formattingOccupiedTimes(fetchReservations);
                setEditReservation(prev => ({ ...prev, startTime: undefined, endTime: undefined }))
            } catch {
                alert('로드 실패')
            }
        }

        console.log(editedReservation.date, 2222)
        if (!!editedReservation.date)
            loadOccupideTimes()

    }, [editedReservation.date])

    useEffect(() => {
        const fetchReservation = async () => {
            const reservation = await loadReservationDetail(reservationId)
            console.log(reservation)
            setEditReservation({ ...reservation });
        }

        fetchReservation();
    }, [reservationId])

    // useEffect(() => {
    //     const loadDetails = (reservationId: number) => {
    //         const fetchReserveDetails = async () => {
    //             const ReservationDetail = await loadReservationDetail(reservationId)

    //             console.log(ReservationDetail)
    //             setEditReservation(ReservationDetail);
    //         }

    //         fetchReserveDetails();
    //     }

    //     loadDetails(reservationId)

    // }, [])

    return (
        <Modal isOpen={visible}>
            {modalState == 'Creator' && <CreatorSelectModal onClose={() => setModalState('None')} visible={modalState == 'Creator'} creatorId={editedReservation.creatorId} setCreator={(user) => setEditReservation(prev => ({ ...prev, creatorId: user.userId, creatorName: user.userName }))} />}
            <div className='font-bold text-lg'>예약 수정</div>
            <form className='flex flex-col'
                onSubmit={tryEditReservation}>
                <div className='flex flex-col gap-6 mx-4 mt-6 mb-12'>
                    <div className='flex-row flex justify-between items-center'>
                        외부 예약
                        <div className='flex flex-row gap-2 items-center'>{editedReservation.reservationType == 'EXTERNAL' ? '예' : '아니오'}
                            <input type="checkbox" id="switch" name="switch"
                                className="hidden peer"
                                checked={editedReservation.reservationType == 'EXTERNAL'}
                                onChange={(e) => {
                                    if (e.currentTarget.checked) setEditReservation(prev => ({ ...prev, reservationType: 'EXTERNAL' }));
                                    else setEditReservation(prev => ({ ...prev, reservationType: 'COMMON' }));
                                }}
                            />
                            <label htmlFor="switch" className="w-16 h-9 border-2 border-[#242020] rounded-full bg-white peer-checked:bg-black block relative cursor-pointer transition-colors duration-200">
                                <div className="z-10 top-0.5 left-0.5 w-6 h-6 bg-black rounded-full transition-transform duration-200 peer-checked:translate-x-7 peer-checked:bg-white"></div>
                            </label>
                        </div>
                    </div>
                    {editedReservation.reservationType != 'EXTERNAL' ?
                        <div className='flex-row flex justify-between items-center'>
                            예약자
                            {editedReservation.creatorId ?
                                <div className='flex flex-row gap-2 items-center'>
                                    {editedReservation.creatorName}
                                    <div className='px-2 py-1 rounded-md bg-[#dddddd] cursor-pointer'
                                        onClick={() => setModalState('Creator')}>
                                        변경
                                    </div>
                                </div>
                                : <div className='px-2 py-1 rounded-md bg-[#dddddd] cursor-pointer'
                                    onClick={() => setModalState('Creator')}>
                                    멤버 선택
                                </div>}
                        </div> :
                        <div className='flex-row flex justify-between items-center'>
                            외부 예약자
                            <input required name='external-username' defaultValue={editedReservation.creatorName} placeholder='외부 예약자 입력' className='w-64 text-lg text-right px-2 outline-none border-b border-gray-700' />
                        </div>}
                    <div className='flex-row flex justify-between'>
                        날짜
                        <input name='reserveDate' type="date" onChange={(e) => (setEditReservation({ ...editedReservation, date: e.currentTarget.value.toString().split('T')[0] }))} value={editedReservation ? new Date(editedReservation?.date).getFullYear() + '-' + (new Date(editedReservation?.date).getMonth() + 1).toString().padStart(2, '0') + '-' + new Date(editedReservation?.date).getDate().toString().padStart(2, '0') : ''} required />
                    </div>
                    <div className='flex-row flex justify-between items-center'>
                        연습 시간
                        <div className='flex flex-row gap-4'>
                            <div className='w-24'>
                                <select className='w-full' name="startTime" id="startTime" value={editedReservation.startTime}
                                    onChange={(e) => {
                                        const newStartTime = e.currentTarget.value as TimeFormat;
                                        if (occupiedTimes?.includes(newStartTime)) {
                                            if (!confirm('예약시간이 중복되는 예약이 있습니다\n그대로 진행하시겠습니까?')) {
                                                e.preventDefault();
                                                return;
                                            }
                                        } else if (editedReservation.endTime) {
                                            const conflictReservations = isConflict(newStartTime, editedReservation.endTime)

                                            if (!!conflictReservations && conflictReservations.length > 0) {
                                                if (!confirm(`이미 예약된 시간이 포함되어 있습니다.(${conflictReservations.length})\n\n${conflictReservations.map(reservation => `${reservation.title} / ${reservation.creatorName} / ${reservation.startTime}~${reservation.endTime}\n`)}\n그대로 진행하시겠습니까?`)) {
                                                    e.preventDefault();
                                                    return;
                                                }
                                            }
                                        }
                                        setEditReservation(prev => ({ ...prev, startTime: newStartTime }))
                                    }}>
                                    <option disabled value={'default'}>시작 시간</option>
                                    {editedReservation.date ? TimeArray.filter((_, index) => index < TimeArray.indexOf(editedReservation.endTime || '22:00')).map(time => (
                                        <option key={'start-' + time} value={time}
                                            className={`w-full ${occupiedTimes?.includes(time) ? 'text-gray-400' : ''}`}
                                        >
                                            {time}
                                        </option>
                                    ))
                                        :
                                        <option disabled className='w-full text-gray-400'>날짜를 선택</option>}
                                </select>
                            </div>
                            ~
                            <div className='w-24'>
                                <select className='w-full' name="endTime" id="endTime" value={editedReservation.endTime}
                                    onChange={(e) => {
                                        const newEndTime = e.currentTarget.value as TimeFormat;
                                        if (occupiedTimes?.includes(newEndTime)) {
                                            if (!confirm('중복되는 예약이 있습니다\n그대로 진행하시겠습니까?')) {
                                                e.preventDefault();
                                                return;
                                            }
                                        } else if (editedReservation.startTime) {
                                            const conflictReservations = isConflict(editedReservation.startTime, newEndTime)
                                            if (!!conflictReservations && conflictReservations.length > 0) {
                                                if (!confirm(`이미 예약된 시간이 포함되어 있습니다.(${conflictReservations.length})\n\n${conflictReservations.map(reservation => `${reservation.title} / ${reservation.creatorName} / ${reservation.startTime}~${reservation.endTime}\n`)}\n그대로 진행하시겠습니까?`)) {
                                                    e.preventDefault();
                                                    return;
                                                }
                                            }
                                        }
                                        setEditReservation(prev => ({ ...prev, endTime: newEndTime }))
                                    }}>
                                    <option disabled value={'default'}>종료 시간</option>
                                    {editedReservation.date ? TimeArray.filter((_, index) => index > TimeArray.indexOf(editedReservation.startTime || '10:00')).map(time => (
                                        <option key={'end-' + time} value={time} className={`w-full ${occupiedTimes?.includes(time) ? 'text-gray-400' : ''}`}>{time}</option>
                                    ))
                                        :
                                        <option disabled className='w-full text-gray-400'>날짜를 선택</option>}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className='flex-row flex justify-between'>
                        연습 내용
                        <input required name='practice-name' onChange={(e) => setEditReservation({ ...editedReservation, title: e.currentTarget.value })} type="text" value={editedReservation?.title} className='w-64 text-lg text-right px-2 outline-none border-b border-gray-700' />
                    </div>
                    {editedReservation.reservationType != 'EXTERNAL' && <div className='flex-row flex justify-between items-center'>
                        정규 연습
                        <div className='flex flex-row gap-2 items-center'>{editedReservation.reservationType == 'REGULAR' ? '예' : '아니오'}
                            <input type="checkbox" id="reservationType" name="reservationType" className="hidden peer"
                                onChange={(e) => {
                                    if (e.currentTarget.checked) setEditReservation(prev => ({ ...prev, reservationType: 'REGULAR' }));
                                    else setEditReservation(prev => ({ ...prev, reservationType: 'COMMON' }));
                                }}
                                checked={editedReservation.reservationType == 'REGULAR'}
                            />
                            <label htmlFor="reservationType" className="w-16 h-9 border-2 border-[#242020] rounded-full bg-white peer-checked:bg-black block relative cursor-pointer transition-colors duration-200">
                                <div className="z-10 top-0.5 left-0.5 w-6 h-6 bg-black rounded-full transition-transform duration-200 peer-checked:translate-x-7 peer-checked:bg-white"></div>
                            </label>
                        </div>
                    </div>}
                    <div className='flex-row flex justify-between'>
                        열린 연습
                        <div className='flex flex-row gap-2 items-center'>{editedReservation.participationAvailable ? '예' : '아니오'}
                            <input type="checkbox" id="participationAvailable" name="participationAvailable" className="hidden peer"
                                onChange={(e) => {
                                    if (e.currentTarget.checked) setEditReservation(prev => ({ ...prev, participationAvailable: true }));
                                    else setEditReservation(prev => ({ ...prev, participationAvailable: false }));
                                }}
                                checked={editedReservation.participationAvailable} />
                            <label htmlFor="participationAvailable" className="w-16 h-9 border-2 border-[#242020] rounded-full bg-white peer-checked:bg-black block relative cursor-pointer transition-colors duration-200">
                                <div className="z-10 top-0.5 left-0.5 w-6 h-6 bg-black rounded-full transition-transform duration-200 peer-checked:translate-x-7 peer-checked:bg-white"></div>
                            </label>
                        </div>
                    </div>
                </div>
                <div className='flex-row flex justify-between'>
                    <div
                        onClick={() => { onClose(); }}
                        className='border border-gray-200 px-4 py-2 rounded-md text-gray-500 cursor-pointer'>닫기</div>
                    <div className='flex flex-row gap-4'>
                        <div
                            onClick={() => { deleteReservation(editedReservation?.reservationId); onClose(); }}
                            className='bg-red-400 px-4 py-2 rounded-md text-white cursor-pointer'>삭제</div>
                        <button type='submit' className='bg-blue-400 px-4 py-2 rounded-md text-white cursor-pointer'>수정</button>
                    </div>

                </div>
            </form>
        </Modal>
    )
}
// search-user

function CreatorSelectModal({ visible, onClose, creatorId, setCreator: setCreatorId }: { visible: boolean, onClose: () => void, creatorId?: number, setCreator: (user: { userId: number, userName: string }) => void }) {

    const [searchingMembers, setSearchMembers] = useState<member[] | null>(null)
    const [isLoading, setLoading] = useState(false)

    // const editReservation = (e: React.FormEvent<HTMLFormElement>) => {
    //     e.preventDefault();
    //     const formData = new FormData(e.currentTarget);

    //     onClose();
    // }
    const [selectedMember, selectMember] = useState<member | undefined>(undefined)

    const [keyword, setKeyword] = useState('')
    const [clubId, setClubId] = useState<string | undefined>(undefined)
    const [role, setRole] = useState<string | undefined>(undefined)

    const clubRef = useRef<HTMLSelectElement>(null)
    const roleRef = useRef<HTMLSelectElement>(null)

    useEffect(() => {
        const loadDetails = () => {
            const fetchReserveDetails = async () => {
                setLoading(true);
                const ReservationDetail = await searchMembers({ username: keyword.length > 0 ? keyword : undefined, clubId, role })

                console.log(ReservationDetail)
                setSearchMembers(ReservationDetail);

                setLoading(false);
            }

            fetchReserveDetails();
        }

        loadDetails()

    }, [keyword, clubId, role])

    const handleKeywordChange = (value: string) => {
        setKeyword(value);
        // setLoading(false);
    };

    // 2) debounce된 함수 생성: 컴포넌트 마운트 시 1회만 생성
    const debouncedHandleChange = useCallback(
        debounce(handleKeywordChange, 800),
        []
    );

    return (
        <Modal isOpen={visible}>
            <div className='absolute right-8 top-4 cursor-pointer' onClick={onClose}>x</div>
            <div className='font-bold text-lg'>예약자 선택</div>
            <div className='flex flex-col gap-2'>
                <div className='flex flex-row justify-between'>
                    <div>옵션</div>
                    <div
                        className='cursor-pointer'
                        onClick={() => {
                            setKeyword('');
                            setClubId(undefined);
                            setRole(undefined);
                            clubRef.current!.selectedIndex = 0;
                            roleRef.current!.selectedIndex = 0;
                        }}>초기화</div>
                </div>

                <div className='flex flex-row gap-4'>
                    <input type="text" placeholder='여기에 검색어'
                        className='border border-[#446fdb] rounded px-2 py-0.5 outline-[#1e3a80]'
                        onChange={(e) => {
                            setLoading(true)
                            debouncedHandleChange(e.currentTarget.value || '');
                        }} />
                    <select ref={clubRef} name="clubId" id="clubId" onChange={(e) => { if (e.currentTarget.value == 'none') setClubId(undefined); else setClubId(e.currentTarget.value) }}
                        className='border border-[#446fdb] rounded px-2 py-0.5 outline-[#1e3a80]'>
                        <option selected value="none">동아리</option>
                        <option value="0">들녘</option>
                        <option value="1">산틀</option>
                        <option value="2">악반</option>
                        <option value="3">신명화랑</option>
                    </select>
                    <select ref={roleRef} name="role" id="role" onChange={(e) => { if (e.currentTarget.value == 'none') setRole(undefined); else setRole(e.currentTarget.value) }}
                        className='border border-[#446fdb] rounded px-2 py-0.5 outline-[#1e3a80]'>
                        <option selected value="none">역할</option>
                        <option value="패짱">패짱</option>
                        <option value="상쇠">상쇠</option>
                        <option value="상장구">상장구</option>
                        <option value="수북">수북</option>
                        <option value="수법고">수법고</option>
                    </select>
                </div>
            </div>

            <div className='w-full h-80 overflow-y-auto border rounded-md mt-4'>
                {isLoading ?
                    <div>
                        로딩중...
                    </div>
                    :
                    searchingMembers && searchingMembers?.length > 0 ?
                        searchingMembers?.map(member => (
                            <div className={`w-full hover:bg-slate-300 cursor-pointer px-2 py-4 ${selectedMember?.memberId == member.memberId ? 'bg-slate-200' : ''}`}
                                onClick={() => { selectMember(member); }}>
                                <div>{member.name}{member.nickname ? ` (${member.nickname})` : ''} ({member.enrollmentNumber}) <span className='text-gray-400 text-sm'>{creatorId == member.memberId && '이전 선택'}</span></div>
                                <div>{member.club}</div>
                                <div>{member.role?.map(role => role).join(', ')}</div>
                            </div>
                        )) :
                        <div>
                            검색 결과 없습니다.
                        </div>
                }
            </div>
            <div className='w-full flex flex-col mt-4'>
                <div className={`px-4 py-2 rounded-md self-center ${selectedMember ? 'bg-blue-500 text-white cursor-pointer' : 'bg-slate-100'}`}
                    onClick={() => {
                        if (!!selectedMember) {
                            setCreatorId({ userId: selectedMember.memberId, userName: selectedMember.name })
                            onClose();
                        }
                    }}>{selectedMember ? `${selectedMember.name} 선택 완료` : '선택'}</div>
            </div>
        </Modal>
    )
}


function BatchAddModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {

    const [modalState, setModalState] = useState<'None' | 'Creator'>('None')
    const [batchReservationOption, setBatchReservationOption] = useState<{ title: string, reservationType: ReservationType, creatorName?: string, creatorId?: number }>({ title: '', reservationType: 'EXTERNAL' })
    const [dayTimes, setDayTimes] = useState<{ day: WeekDay, startTime?: TimeFormat, endTime?: TimeFormat }[]>([])
    const [duration, setDuration] = useState<{ startDate?: Date, endDate?: Date }>({})
    const [creatorName, setCreatorName] = useState('')
    const dayOptionRef = useRef<HTMLSelectElement>(null)


    const addDayTime = (newDayTime: { day: WeekDay, startTime?: TimeFormat, endTime?: TimeFormat }) => {
        setDayTimes((prev) => {
            const updated = [...prev, newDayTime];
            return updated.sort((a, b) => {
                const idxA = weekdays_ko.indexOf(a.day);
                const idxB = weekdays_ko.indexOf(b.day);
                return idxA - idxB;
            });
        });
    }

    const removeDayTime = ((index: number) => {
        setDayTimes((prev) => prev.filter((_, i) => i !== index));
    });


    const addBatch = () => {
        const fetchAddBatchReservation = async () => {

            if (dayTimes.length == 0) {
                alert('연습 일정을 추가해주세요')
                return;
            }
            const validDayTime = dayTimes.filter(data => data.startTime != undefined && data.endTime != undefined) as { day: WeekDay, startTime: TimeFormat, endTime: TimeFormat }[]
            if (validDayTime.length == 0) {
                alert('연습 일정에 시간을 지정해주세요')
                return;
            }
            if (!duration.endDate || !duration.startDate) {
                alert('추가할 기간을 추가해주세요')
                return;
            }
            if ((batchReservationOption.reservationType == 'EXTERNAL' && (!batchReservationOption.creatorName || batchReservationOption.creatorName?.length == 0)) ||
                (batchReservationOption.reservationType != 'EXTERNAL' && !batchReservationOption.creatorId)) {
                alert('예약자를 확인해주세요')
                return;
            }
            try {

                const validOption: Record<string, any> = {
                    title: batchReservationOption.title.length > 0 ?
                        batchReservationOption.title.length
                        : `${josa((batchReservationOption.reservationType == 'EXTERNAL' ? batchReservationOption.creatorName! : creatorName!), '이/가') + ' 만든 정기 연습'}`,
                    reservationType: batchReservationOption.reservationType,
                }
                if (batchReservationOption.reservationType == 'EXTERNAL') {
                    validOption.creatorName = batchReservationOption.creatorName
                } else {
                    validOption.creatorId = batchReservationOption.creatorId
                }
                const response = await addBatchReservation(
                    {
                        dayTimes: validDayTime,
                        duration: { startDate: duration.startDate.toISOString().split('T')[0], endDate: duration.endDate.toISOString().split('T')[0] },
                        batchReservationOption: { ...validOption as batchReservationOptions<ReservationType> }
                    });

                if (response) alert('success')
                else alert('failed')
            }
            catch {
                alert('failed')
            }
        }

        fetchAddBatchReservation();
    }

    return (
        <Modal isOpen={isOpen}>
            <div className='flex flex-col gap-4'>
                {modalState == 'Creator' && <CreatorSelectModal onClose={() => setModalState('None')} visible={true}
                    setCreator={({ userId, userName }) => {
                        if (batchReservationOption.reservationType != 'EXTERNAL') setBatchReservationOption(prev => ({ ...prev, creatorId: userId, creatorName: undefined }));
                        setCreatorName(userName);
                    }} />}
                <div>정기 일정 추가</div>
                <form action="" className='flex flex-col gap-4'>
                    <div className='flex-row flex justify-between items-center'>
                        외부 예약
                        <div className='flex flex-row gap-2 items-center'>{batchReservationOption.reservationType == 'EXTERNAL' ? '예' : '아니오'}
                            <input type="checkbox" id="switch" name="switch"
                                className="hidden peer"
                                checked={batchReservationOption.reservationType == 'EXTERNAL'}
                                onChange={(e) => {
                                    if (e.currentTarget.checked) setBatchReservationOption(prev => ({ ...prev, reservationType: 'EXTERNAL', creatorId: undefined, creatorName: '' }));
                                    else setBatchReservationOption(prev => ({ ...prev, reservationType: 'COMMON', creatorName: undefined, creatorId: undefined }));
                                }}
                            />
                            <label htmlFor="switch" className="w-16 h-9 border-2 border-[#242020] rounded-full bg-white peer-checked:bg-black block relative cursor-pointer transition-colors duration-200">
                                <div className="z-10 top-0.5 left-0.5 w-6 h-6 bg-black rounded-full transition-transform duration-200 peer-checked:translate-x-7 peer-checked:bg-white"></div>
                            </label>
                        </div>
                    </div>
                    {batchReservationOption.reservationType != 'EXTERNAL' && <div className='flex-row flex justify-between items-center'>
                        정규 연습
                        <div className='flex flex-row gap-2 items-center'>{batchReservationOption.reservationType == 'REGULAR' ? '예' : '아니오'}
                            <input type="checkbox" id="reservationType" name="reservationType" className="hidden peer"
                                onChange={(e) => {
                                    if (e.currentTarget.checked) setBatchReservationOption(prev => ({ ...prev, reservationType: 'REGULAR' }));
                                    else setBatchReservationOption(prev => ({ ...prev, reservationType: 'COMMON' }));
                                }}
                                checked={batchReservationOption.reservationType == 'REGULAR'}
                            />
                            <label htmlFor="reservationType" className="w-16 h-9 border-2 border-[#242020] rounded-full bg-white peer-checked:bg-black block relative cursor-pointer transition-colors duration-200">
                                <div className="z-10 top-0.5 left-0.5 w-6 h-6 bg-black rounded-full transition-transform duration-200 peer-checked:translate-x-7 peer-checked:bg-white"></div>
                            </label>
                        </div>
                    </div>}
                    {batchReservationOption.reservationType != 'EXTERNAL' ?
                        <div className='flex-row flex justify-between items-center'>
                            예약자
                            {batchReservationOption.creatorId != -1 ?
                                <div className='flex flex-row gap-2 items-center'>
                                    {creatorName}
                                    <div className='px-2 py-1 rounded-md bg-[#dddddd] cursor-pointer'
                                        onClick={() => setModalState('Creator')}>
                                        변경
                                    </div>
                                </div>
                                : <div className='px-2 py-1 rounded-md bg-[#dddddd] cursor-pointer'
                                    onClick={() => setModalState('Creator')}>
                                    멤버 선택
                                </div>}
                        </div> :
                        <div className='flex-row flex justify-between items-center'>
                            외부 예약자
                            <input required name='external-username' placeholder='외부 예약자 입력'
                                value={batchReservationOption.creatorName ?? ''}
                                onChange={(e) => {
                                    const newValue = e.currentTarget.value;
                                    if (newValue)
                                        setBatchReservationOption(prev => ({ ...prev, creatorName: newValue }))
                                    else setBatchReservationOption(prev => ({ ...prev, creatorName: '' }))
                                }}
                                className='w-64 text-lg text-right px-2 outline-none border-b border-gray-700' />
                        </div>}
                    <div className='flex-row flex justify-between'>
                        연습 내용
                        <input required name='practice-name' className='w-64 text-lg text-right px-2 outline-none border-b border-gray-700' />
                    </div>
                    <div className='flex flex-row justify-between'>
                        <div>요일 선택</div>

                        <select ref={dayOptionRef} name="" id="" defaultValue={'default'}
                            onChange={(e) => {
                                const weekday = e.currentTarget.value as WeekDay;
                                addDayTime({ day: weekday })
                                if (dayOptionRef.current)
                                    dayOptionRef.current.value = 'default';
                            }}>
                            <option defaultChecked disabled value={'default'}>요일 추가</option>
                            {weekdays_ko
                                .filter((weekday) => !dayTimes.some((entry) => entry.day === weekday)) // 이미 추가된 요일 필터링
                                .map(weekday => (
                                    <option key={weekday} id={'option-' + weekday} value={weekday}>
                                        {weekday}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className='py-4 rounded-md bg-gray-200 flex flex-col gap-4 px-2 '>

                        {dayTimes.map((data, index) => (
                            <div className='flex flex-row justify-between' key={`day-${index} `}>
                                <div>{data.day}요일</div>
                                <div className='flex flex-row gap-4'>
                                    <div className='w-24'>
                                        <select
                                            className='w-full'
                                            name="startTime"
                                            id="startTime"
                                            value={data.startTime || 'default'}
                                            onChange={(e) => {
                                                const newStartTime = e.currentTarget.value as TimeFormat;

                                                // 특정 인덱스의 startTime 업데이트
                                                setDayTimes((prev) =>
                                                    prev.map((item, i) =>
                                                        i === index ? { ...item, startTime: newStartTime } : item
                                                    )
                                                );
                                            }}
                                        >
                                            <option disabled value={'default'}>시작 시간</option>
                                            {TimeArray.filter(
                                                (_, i) => i < TimeArray.indexOf(data.endTime || '22:00')
                                            ).map((time) => (
                                                <option key={'start-' + time} value={time}>
                                                    {time}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    ~
                                    <div className='w-24'>
                                        <select
                                            className='w-full'
                                            name="endTime"
                                            id="endTime"
                                            value={data.endTime || 'default'}
                                            onChange={(e) => {
                                                const newEndTime = e.currentTarget.value as TimeFormat;

                                                // 특정 인덱스의 endTime 업데이트
                                                setDayTimes((prev) =>
                                                    prev.map((item, i) =>
                                                        i === index ? { ...item, endTime: newEndTime } : item
                                                    )
                                                );
                                            }}
                                        >
                                            <option disabled value={'default'} className='bg-gray-200'>종료 시간</option>
                                            {TimeArray.filter(
                                                (_, i) => i > TimeArray.indexOf(data.startTime || '10:00')
                                            ).map((time) => (
                                                <option key={'end-' + time} value={time}>
                                                    {time}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div
                                        className='cursor-pointer'
                                        onClick={() => {
                                            // 특정 항목 삭제
                                            removeDayTime(index);
                                        }}
                                    >
                                        X
                                    </div>
                                </div>
                            </div>
                        )
                        )}
                    </div>


                    <div className='flex-row flex justify-between'>
                        시작 날짜
                        <input name='startDate' type="date"

                            min={new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            max={duration.endDate ? new Date(duration.endDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] : ''}

                            value={duration.startDate ? duration.startDate.toISOString().split('T')[0] : ''}

                            onChange={(e) => {
                                const selectedDateString = e.currentTarget.value;
                                const selectedDate = new Date(selectedDateString)
                                if (!!selectedDateString)
                                    setDuration(prev => ({ ...prev, startDate: selectedDate }))
                            }} required />
                    </div>

                    <div className='flex-row flex justify-between'>
                        종료 날짜
                        <input name='endDate' type="date"

                            min={duration.startDate ? new Date(duration.startDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            max={new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}

                            value={duration.endDate ? duration.endDate.toISOString().split('T')[0] : ''}

                            onChange={(e) => {
                                const selectedDateString = e.currentTarget.value;
                                const selectedDate = new Date(selectedDateString)
                                if (!!selectedDateString)
                                    setDuration(prev => ({ ...prev, endDate: selectedDate }))
                            }} required />
                    </div>
                    <div className='flex flex-row justify-between'>
                        <div className='px-2 py-1 cursor-pointer rounded-md border border-gray-500 text-gray-500' onClick={onClose}>닫기</div>
                        <div className='px-2 py-1 cursor-pointer rounded-md border bg-blue-500 text-white' onClick={addBatch}>적용</div>
                    </div>
                </form>
            </div>

        </Modal>
    )
}

interface member {
    memberId: number;
    name: string;
    nickname?: string;
    club?: string;
    enrollmentNumber?: string;
    role?: string[];
    profileImageUrl?: string;
}