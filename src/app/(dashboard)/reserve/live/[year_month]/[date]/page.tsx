'use client'
import { useEffect, useState } from 'react';
import Modal from '@admin/app/(dashboard)/modal';
import loadDailyReserves from './utils';
import { useParams } from 'next/navigation';

interface briefReservation {
    reservationId: number;              // 예약 ID
    creatorName: string;                // 생성자 이름
    date: string;                       // 예약 날짜 (YYYY-MM-DD 형식)
    type: string;                       // 예약 유형
    startTime: string;                  // 시작 시간 (HH:MM:SS 형식)
    endTime: string;                    // 종료 시간 (HH:MM:SS 형식)
    message: string;                    // 예약 메시지
    participationAvailable: boolean;    // 참여 가능 여부
    lastmodified: string;               // 마지막 수정 시간 (ISO 8601 형식)
}

export default function DateReservesPage() {
    const params = useParams();
    const selectedDate = new Date(params.year_month + '-' + params.date)

    const [modalVisible, setModalVisible] = useState(false);
    const [participantsModalVisible, setPModalVisible] = useState(false);
    const [participants, setParticipants] = useState<any[]>([]);
    const [instrumentsModalVisible, setIModalVisible] = useState(false);
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
    }, [])

    const addReservation = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const reserveDate = formData.get('reserveDate') as string;
        const title = formData.get('practice-name') as string;
        console.log({ reserveDate, title, participants, instruments })

        setInstruments([]);
        setParticipants([]);
        setModalVisible(false);
        setDefaultDate(null);
    }

    return (
        <>
            <div className="text-gray-400 font-medium">
                {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 {daysOfWeek[selectedDate.getDay()]}요일
            </div>

            <div className='relative flex flex-col mx-2 my-4'>
                {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((value) => {
                    return (<div key={value+'TIME_'} className={`w-full h-24 py-6 text-center`}>
                        <div className='flex flex-col justify-center' onClick={() => {
                            setDefaultDate(selectedDate)
                            setModalVisible(true)
                        }}>
                            <div className='text-2xl  cursor-pointer'>+</div>
                        </div>
                    </div>)
                })}
                {reserves.map((reserve, index) => {
                    return (
                        <div className={`absolute w-full py-8 text-center cursor-pointer ${renderColor[index % 6]}`} style={{ top: `${6 * (Number(reserve.startTime.slice(0, 2)) - 10)}rem`, height: `${6 * (Number(reserve.endTime.slice(0, 2)) - Number(reserve.startTime.slice(0, 2)))}rem` }}>
                            <div>무슨 무슨 예약</div>
                            <div className='text-sm'>{`${reserve.startTime.slice(0, 2)}:00~${reserve.endTime.slice(0, 2)}:00`}</div>
                        </div>)
                })}
            </div>


            {/* 모달부분 */}

            <div className=' bg-slate-400 w-12 h-12 bottom-8 fixed right-12 text-white font-bold text-2xl flex flex-col justify-center items-center cursor-pointer rounded-full'
                onClick={() => setModalVisible(true)}>+
            </div>

            <Modal isOpen={modalVisible}>
                <div className='font-bold text-lg'>예약 추가</div>
                <form className='flex flex-col'
                    onSubmit={addReservation}>
                    <div className='flex flex-col gap-6 mx-4 mt-6 mb-12'>
                        <div className='flex-row flex justify-between'>
                            날짜
                            <input name='reserveDate' type="date" value={defaultDate ? defaultDate.getFullYear() + '-' + (defaultDate.getMonth() + 1).toString().padStart(2, '0') + '-' + defaultDate?.getDate().toString().padStart(2, '0') : ''} required />
                        </div>
                        <div className='flex-row flex justify-between'>
                            연습 내용
                            <input required name='practice-name' type="text" className='w-40 text-lg text-right px-2 outline-none border-b border-gray-700' />
                        </div>
                        <div className='flex-row flex justify-between items-center'>
                            연습 인원
                            <div className='flex-row flex items-center'>
                                {
                                    <div className='mx-2'>
                                        {
                                            participants.slice(0, 3).map(member => `${member} `)
                                        }
                                    </div>
                                }
                                <div className='cursor-pointer px-2 py-1 bg-gray-500 text-white rounded'
                                    onClick={() => setPModalVisible(true)}>
                                    인원 선택 {participants.length > 0 && ` (${participants.length})`}
                                </div>
                            </div>
                        </div>
                        <div className={instruments.length == 0 ? 'flex-row flex justify-between items-center' : 'flex flex-col items-start'}>
                            대여 악기
                            {instruments.length == 0 ?
                                <div className='cursor-pointer px-2 py-1 bg-gray-500 text-white rounded'
                                    onClick={() => setIModalVisible(true)}>
                                    악기 선택
                                </div> :
                                <div className='mt-2 cursor-pointer flex flex-row bg-gray-100 rounded-md py-4 w-full justify-evenly'
                                    onClick={() => setIModalVisible(true)}>
                                    {['꽹과리', '장구', '북', '소고', '기타'].map(type => {
                                        const count = instruments.filter(instrument => instrument.type == type).length;
                                        const isExist = count > 0;
                                        return (
                                            <div className='flex flex-col w-12 items-center'>
                                                <div className='text-sm font-bold'>{type}</div>
                                                <div className={`text-2xl font-normal ${isExist ? 'text-blue-600' : 'text-gray-400'}`}>{isExist ? count : '-'}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            }
                        </div>
                    </div>
                    <div className='flex-row flex justify-between'>
                        <div onClick={() => { setModalVisible(false); setInstruments([]); setParticipants([]); setDefaultDate(null) }} className='bg-red-400 px-4 py-2 rounded-md text-white'>닫기</div>
                        <button type='submit' className='bg-blue-400 px-4 py-2 rounded-md text-white'>저장</button>
                    </div>
                </form>
            </Modal>
            <Modal isOpen={participantsModalVisible}>
                <div className='flex flex-col gap-4'>
                    <div className='flex flex-row justify-between items-end'>
                        <div className='font-bold text-lg'>인원 선택</div>
                        <div className='font-bold text-sm text-gray-400 cursor-pointer'
                            onClick={() => setParticipants([])}>초기화</div>
                    </div>
                    <div className='rounded-md flex flex-col my-1 h-48 border-stone-200 border overflow-scroll'>
                        <div className='flex flex-row sticky top-0 z-50 justify-around py-1 bg-slate-400'>
                            <div className='flex-grow text-center'>이름(패명)</div>
                            <div className='w-28 text-center'>패</div>
                            <div className='w-28 text-center'>선택</div>
                        </div>
                        {[1, 2, 3, 5, 6, 7, 8].map((member, index) => (<div className='flex flex-row sticky justify-around py-1 border-b border-gray-200'>
                            <div className='flex-grow text-center'>홍길동(길동색시)</div>
                            <div className='w-28 text-center'>산틀</div>
                            <div className='w-28 items-center flex flex-col justify-center'>
                                <input type="checkbox" checked={participants.includes(member)} name={`${member}-${index}`} id={`${member}-${index}`} onChange={(e) => {
                                    if (e.currentTarget.checked)
                                        setParticipants([...participants, member])
                                    else {
                                        const newMember = participants.filter(participant => participant != member)
                                        setParticipants(newMember);
                                    }
                                }} />
                            </div>
                        </div>))}
                    </div>
                    <div className='cursor-pointer px-4 py-1 text-center self-center bg-red-400 text-white rounded cursor-pointer'
                        onClick={() => setPModalVisible(false)}>닫기</div>
                </div>
            </Modal>
            <Modal isOpen={instrumentsModalVisible}>
                <div className='flex flex-col gap-4'>
                    <div className='flex flex-row justify-between items-end'>
                        <div className='font-bold text-lg'>악기 선택</div>
                        <div className='font-bold text-sm text-gray-400 cursor-pointer'
                            onClick={() => setInstruments([])}>초기화</div>
                    </div>

                    <div className='rounded-md flex flex-col my-1 h-48 border-stone-200 border overflow-scroll'>
                        <div className='flex flex-row sticky top-0 z-50 justify-around py-1 bg-slate-400'>
                            <div className='flex-grow text-center'>악기</div>
                            <div className='w-28 text-center'>패</div>
                            <div className='w-28 text-center'>선택</div>
                        </div>
                        {[1, 2, 3, 5, 6, 7, 8].map((instrument, index) => (<div className='flex flex-row sticky justify-around py-1 border-b border-gray-200'>
                            <div className='flex-grow text-center'>금쇠(팔문금쇠진)</div>
                            <div className='w-28 text-center'>산틀</div>
                            <div className='w-28 items-center flex flex-col justify-center'>
                                <input type="checkbox" checked={instruments.includes(instrument)} name={`${instrument}-${index}`} id={`${instrument}-${index}`}
                                    onChange={(e) => {
                                        if (e.currentTarget.checked)
                                            setInstruments([...instruments, instrument])
                                        else {
                                            const newInstruments = instruments.filter(hasBeen => hasBeen != instrument)
                                            setInstruments(newInstruments);
                                        }
                                    }} />
                            </div>
                        </div>))}
                    </div>
                    <div className='cursor-pointer px-4 py-1 text-center self-center bg-red-400 text-white rounded'
                        onClick={() => setIModalVisible(false)}>닫기</div>
                </div>
            </Modal>
        </>
    )
}