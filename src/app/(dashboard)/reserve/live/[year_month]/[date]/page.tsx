'use client'
import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '@admin/app/(dashboard)/modal';
import { deleteReservation, loadDailyReserves, loadReservationDetail } from './utils';
import { useParams } from 'next/navigation';
import RBButton from '@admin/app/(dashboard)/RBbutton';
import { includes } from 'lodash';
import loadMonthlyReserves from '../../calendar/utils';

interface briefReservation {
    reservationId: number;              // 예약 ID
    creatorName: string;                // 생성자 이름
    date: string;                       // 예약 날짜 (YYYY-MM-DD 형식)
    type: string;                       // 예약 유형
    startTime: string;                  // 시작 시간 (HH:MM:SS 형식)
    endTime: string;                    // 종료 시간 (HH:MM:SS 형식)
    title: string;                    // 예약 메시지
    participationAvailable: boolean;    // 참여 가능 여부
    lastmodified: string;               // 마지막 수정 시간 (ISO 8601 형식)
}

interface ReservationDetail extends briefReservation {
    participators: any[]
}

export default function DateReservesPage() {
    const params = useParams();
    const selectedDate = new Date(params.year_month + '-' + params.date)

    const [editedReservation, setEditReservation] = useState<any | null>(null)
    const [editModalVisible, setEditModalVisible] = useState(false);


    const [participants, setParticipants] = useState<any[]>([]);
    const [instruments, setInstruments] = useState<any[]>([]);
    const [defaultDate, setDefaultDate] = useState<Date | null>(null);
    const [reserves, loadReserves] = useState<briefReservation[]>([])

    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const renderColor = ['bg-slate-200', 'bg-blue-200', 'bg-red-200', 'bg-green-200', 'bg-yellow-200', 'bg-lime-200']


    useEffect(() => {
        const fetchDailyReserve = async () => {
            const dailyReserves: briefReservation[] = await loadDailyReserves(selectedDate)
            loadReserves(dailyReserves);
        }

        fetchDailyReserve();
    }, [editModalVisible])


    const loadDetails = (reservationId: number) => {
        const fetchReserveDetails = async () => {
            const ReservationDetail = await loadReservationDetail(reservationId)

            setEditReservation(ReservationDetail);
            setParticipants(ReservationDetail.participators ?? [])
            setParticipants(ReservationDetail.instruments ?? [])
            setEditModalVisible(true)
        }

        fetchReserveDetails();
    }

    const editReservation = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const reserveDate = formData.get('reserveDate') as string;
        const title = formData.get('practice-name') as string;

        setInstruments([]);
        setParticipants([]);
        setEditModalVisible(false);
        setDefaultDate(null);
    }
    const weekdays_ko = ['월', '화', '수', '목', '금', '토', '일'];
    const weekdays_us = ['m', 't', 'w', 'th', 'f', 's', 'su'];
    const times = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

    const selectedWeek = useMemo(() => {
        const day = selectedDate.getDay() == 0 ? 7 : selectedDate.getDay();
        const week: number[] = [];
        const startDate = new Date(selectedDate).getDate() - day + 1

        for (let i = 0; i < 7; i++) {
            week.push(startDate + i)
        }

        return week;
    }, [selectedDate])

    return (
        <>

<div className="text-gray-400 font-medium mx-2">
                {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 {daysOfWeek[selectedDate.getDay()]}요일
            </div>

            <div className='relative flex flex-col mx-2 my-4'>
                {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((time, index) => {
                    return (
                        <>
                            <div key={time + index} className='flex flex-row items-center mx-4 h-4'>
                                <div style={{ height: 0.5 }} className='bg-gray-400 flex-grow overflow-visible' />
                                <div className='self-center text-base w-16 text-center text-gray-500' >{`${time >= 12 ? time == 12 ? `PM 12` : `PM ${(time - 12).toString().padStart(2, '0')}` : `AM ${time}`}`}</div>
                                <div style={{ height: 0.5 }} className='bg-gray-400 h-0.5 flex-grow overflow-visible' />
                            </div>
                            {(time != 22) &&
                                <div className='h-32 flex items-center justify-center'>
                                    <div className='h-0 border border-dashed border-gray-100 w-full' />
                                </div>
                            }
                        </>)
                    // return (<div key={'TIME_' + value} className={`w-full h-24 py-6 text-center`}>
                    //     <div className='flex flex-col justify-center' onClick={() => {
                    //         setDefaultDate(selectedDate)
                    //         setCreateModalVisible(true)
                    //     }}>
                    //         <div className='text-2xl  cursor-pointer'>+</div>
                    //     </div>
                    // </div>)
                })}
                {reserves.map((reserve, index) => {
                    const [startHour, startMinnute] = reserve.startTime.split(':').map(value => Number(value));
                    const [endHour, endMinnute] = reserve.endTime.split(':').map(value => Number(value));

                    return (
                        //1칸에 9rem 반칸에 4.5rem
                        <div className={`gap-2 absolute w-full rounded-sm flex flex-col flex-wrap justify-center text-center cursor-pointer ${renderColor[index % 6]}`}
                            style={{
                                top: `${9 * (startHour - 10) + 4.5 * (startMinnute % 60 / 30) + 0.5}rem`,
                                height: `${9 * (endHour - startHour) + 4.5 * ((endMinnute - startMinnute) % 60) / 30}rem`
                            }}
                            onClick={() => loadDetails(reserve.reservationId)}>
                            <div>{reserve.title}</div>
                            <div className='text-sm'>{`${reserve.startTime.slice(0, 5)}~${reserve.endTime.slice(0, 5)}`}</div>
                        </div>)
                })}
            </div>


            <Modal isOpen={editModalVisible}>
                <div className='font-bold text-lg'>예약 수정</div>
                <form className='flex flex-col'
                    onSubmit={editReservation}>
                    <div className='flex flex-col gap-6 mx-4 mt-6 mb-12'>
                        <div className='flex-row flex justify-between'>
                            예약자
                            <div>{editedReservation?.creatorName}</div>
                        </div>
                        <div className='flex-row flex justify-between'>
                            날짜
                            <input name='reserveDate' type="date" onChange={(e) => (setEditReservation({ ...editedReservation, date: e.currentTarget.value.toString().split('T')[0] }))} value={editedReservation ? new Date(editedReservation?.date).getFullYear() + '-' + (new Date(editedReservation?.date).getMonth() + 1).toString().padStart(2, '0') + '-' + new Date(editedReservation?.date).getDate().toString().padStart(2, '0') : ''} required />
                        </div>
                        <div className='flex-row flex justify-between'>
                            연습 내용
                            <input required name='practice-name' onChange={(e) => setEditReservation({ ...editedReservation, title: e.currentTarget.value })} type="text" value={editedReservation?.title} className='w-64 text-lg text-right px-2 outline-none border-b border-gray-700' />
                        </div>
                        <div className='flex-row flex justify-between'>
                            정규 연습
                            <div>{editedReservation?.type == '정기연습' ? '예' : '아니오'}</div>
                        </div>
                        <div className='flex-row flex justify-between'>
                            열린 연습
                            <div>{editedReservation?.participationAvailable ? '예' : '아니오'}</div>
                        </div>
                    </div>
                    <div className='flex-row flex justify-between'>
                        <div
                            onClick={() => { setEditModalVisible(false); setEditReservation(null); setInstruments([]); setParticipants([]); setDefaultDate(null) }}
                            className='border border-gray-200 px-4 py-2 rounded-md text-gray-500 cursor-pointer'>닫기</div>
                        <div className='flex flex-row gap-4'>
                            <div
                                onClick={() => { deleteReservation(editedReservation?.reservationId); setEditModalVisible(false); setEditReservation(null); setInstruments([]); setParticipants([]); setDefaultDate(null) }}
                                className='bg-red-400 px-4 py-2 rounded-md text-white cursor-pointer'>삭제</div>
                            <button type='submit' className='bg-blue-400 px-4 py-2 rounded-md text-white cursor-pointer'>수정</button>
                        </div>

                    </div>
                </form>
            </Modal>

        </>
    )
}