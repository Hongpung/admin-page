'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '@admin/app/(dashboard)/modal';
import { createReservation, deleteReservation, editReservation, loadDailyOccupiedTimes, loadDailyReservations, loadReservationDetail, searchMembers } from './utils';
import { useParams } from 'next/navigation';
import RBButton from '@admin/app/(dashboard)/RBbutton';
import { debounce } from 'lodash';

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

interface dateReservation {
    amountOfParticipators: number;
    reservationId: number;
    creatorName: string;
    creatorNickname: string;
    date: string;
    startTime: string;
    endTime: string;
    title: string;
    reservationType: reservationType;
    participationAvailable: boolean;
}

interface briefUser {
    userId: number;
    name: string;
    nickname: string;
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
    type: reservationType;                       // 예약 유형
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
    type: reservationType;                       // 예약 유형
    startTime?: TimeFormat;                  // 시작 시간 (HH:MM:SS 형식)
    endTime?: TimeFormat;                    // 종료 시간 (HH:MM:SS 형식)
    title: string;                    // 예약 메시지
    participationAvailable: boolean;    // 참여 가능 여부
}

export default function DateReservesPage() {
    const params = useParams();
    const selectedDate = new Date(params.year_month + '-' + params.date)

    const [editReservationId, setEditReservationId] = useState<number | null>(null)
    const [modalState, setModalState] = useState<'Create' | 'Edit' | 'None'>('None')
    const [reservations, loadReservations] = useState<dateReservation[]>([])

    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const renderColor = ['bg-slate-200', 'bg-blue-200', 'bg-red-200', 'bg-green-200', 'bg-yellow-200', 'bg-lime-200']


    useEffect(() => {
        const fetchDailyReserve = async () => {
            const dailyReserves: dateReservation[] = await loadDailyReservations(selectedDate)
            loadReservations(dailyReserves);
        }
        if (modalState == 'None')
            fetchDailyReserve();
    }, [modalState])

    return (
        <>
            <RBButton
                color='gray'
                onClick={() => {
                    setModalState('Create')
                }}>
                +
            </RBButton>
            <div className="text-gray-400 font-medium mx-2">
                {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 {daysOfWeek[selectedDate.getDay()]}요일
            </div>

            <div key={'times'} className='relative flex flex-col mx-2 my-4'>
                {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((time, index) => {
                    return (
                        <>
                            <div key={time + index} className='flex flex-row items-center mx-4 h-4'>
                                <div style={{ height: 0.5 }} className='bg-gray-400 flex-grow overflow-visible' />
                                <div className='self-center text-base w-16 text-center text-gray-500' >{`${time >= 12 ? time == 12 ? `PM 12` : `PM ${(time - 12).toString().padStart(2, '0')}` : `AM ${time}`}`}</div>
                                <div style={{ height: 0.5 }} className='bg-gray-400 h-0.5 flex-grow overflow-visible' />
                            </div>
                            {(time != 22) &&
                                <div key={'last' + time} className='h-32 flex items-center justify-center'>
                                    <div className='h-0 border border-dashed border-gray-100 w-full' />
                                </div>
                            }
                        </>)
                })}
                {reservations.map((reserve, index) => {
                    const [startHour, startMinnute] = reserve.startTime.split(':').map(value => Number(value));
                    const [endHour, endMinnute] = reserve.endTime.split(':').map(value => Number(value));

                    return (
                        //1칸에 9rem 반칸에 4.5rem
                        <div key={'reservation-' + reserve.reservationId} className={`gap-2 absolute w-full rounded-sm flex flex-col flex-wrap justify-center text-center cursor-pointer ${renderColor[index % 6]}`}
                            style={{
                                top: `${9 * (startHour - 10) + 4.5 * (startMinnute % 60 / 30) + 0.5}rem`,
                                height: `${9 * (endHour - startHour) + 4.5 * ((endMinnute - startMinnute) % 60) / 30}rem`
                            }}
                            onClick={() => {
                                setEditReservationId(reserve.reservationId)
                                setModalState('Edit')
                                console.log(reserve.reservationId)
                            }}>
                            <div>{reserve.title}</div>
                            <div className='text-sm'>{`${reserve.startTime.slice(0, 5)}~${reserve.endTime.slice(0, 5)}`}</div>
                        </div>)
                })}
            </div>

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
        type: 'COMMON',
        participationAvailable: true,
    })
    const [existReservations, setExistReservations] = useState<OccupiedReservation[] | null>(null)

    const tryCreateReservation = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const title = formData.get('practice-name') as string;
        const { date, startTime, endTime, type, participationAvailable, creatorId } = newReservation;

        // 공통 필드를 가진 reservationForm 생성
        const reservationForm: any = {
            title,
            date,
            startTime,
            endTime,
            reservationType: type,          // 백엔드에 넘길 때 프로퍼티 이름에 맞춰 사용
            participationAvailable,
        };
        if (newReservation.type == 'EXTERNAL') {
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
                type: 'COMMON',
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
                        <div className='flex flex-row gap-2 items-center'>{newReservation.type == 'EXTERNAL' ? '예' : '아니오'}
                            <input type="checkbox" id="switch" name="switch"
                                className="hidden peer"
                                checked={newReservation.type == 'EXTERNAL'}
                                onChange={(e) => {
                                    if (e.currentTarget.checked) setNewReservation(prev => ({ ...prev, type: 'EXTERNAL' }));
                                    else setNewReservation(prev => ({ ...prev, type: 'COMMON' }));
                                }}
                            />
                            <label htmlFor="switch" className="w-16 h-9 border-2 border-[#242020] rounded-full bg-white peer-checked:bg-black block relative cursor-pointer transition-colors duration-200">
                                <div className="z-10 top-0.5 left-0.5 w-6 h-6 bg-black rounded-full transition-transform duration-200 peer-checked:translate-x-7 peer-checked:bg-white"></div>
                            </label>
                        </div>
                    </div>
                    {newReservation.type != 'EXTERNAL' ?
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
                    {newReservation.type != 'EXTERNAL' && <div className='flex-row flex justify-between items-center'>
                        정규 연습
                        <div className='flex flex-row gap-2 items-center'>{newReservation.type == 'REGULAR' ? '예' : '아니오'}
                            <input type="checkbox" id="reservationType" name="reservationType" className="hidden peer"
                                onChange={(e) => {
                                    if (e.currentTarget.checked) setNewReservation(prev => ({ ...prev, type: 'REGULAR' }));
                                    else setNewReservation(prev => ({ ...prev, type: 'COMMON' }));
                                }}
                                checked={newReservation.type == 'REGULAR'}
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
                                type: 'COMMON',
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
        type: 'COMMON',
    })

    const tryEditReservation = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const title = formData.get('practice-name') as string;
        const { date, startTime, endTime, type, participationAvailable, creatorId } = editedReservation;

        // 공통 필드를 가진 reservationForm 생성
        const reservationForm: any = {
            title,
            date,
            startTime,
            endTime,
            reservationType: type,          // 백엔드에 넘길 때 프로퍼티 이름에 맞춰 사용
            participationAvailable,
        };
        if (editedReservation.type == 'EXTERNAL') {
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
            const response = await editReservation(reservationId,reservationForm)

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
                        <div className='flex flex-row gap-2 items-center'>{editedReservation.type == 'EXTERNAL' ? '예' : '아니오'}
                            <input type="checkbox" id="switch" name="switch"
                                className="hidden peer"
                                checked={editedReservation.type == 'EXTERNAL'}
                                onChange={(e) => {
                                    if (e.currentTarget.checked) setEditReservation(prev => ({ ...prev, type: 'EXTERNAL' }));
                                    else setEditReservation(prev => ({ ...prev, type: 'COMMON' }));
                                }}
                            />
                            <label htmlFor="switch" className="w-16 h-9 border-2 border-[#242020] rounded-full bg-white peer-checked:bg-black block relative cursor-pointer transition-colors duration-200">
                                <div className="z-10 top-0.5 left-0.5 w-6 h-6 bg-black rounded-full transition-transform duration-200 peer-checked:translate-x-7 peer-checked:bg-white"></div>
                            </label>
                        </div>
                    </div>
                    {editedReservation.type != 'EXTERNAL' ?
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
                            <input required name='external-username' placeholder='외부 예약자 입력' className='w-64 text-lg text-right px-2 outline-none border-b border-gray-700' />
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
                    {editedReservation.type != 'EXTERNAL' && <div className='flex-row flex justify-between items-center'>
                        정규 연습
                        <div className='flex flex-row gap-2 items-center'>{editedReservation.type == 'REGULAR' ? '예' : '아니오'}
                            <input type="checkbox" id="reservationType" name="reservationType" className="hidden peer"
                                onChange={(e) => {
                                    if (e.currentTarget.checked) setEditReservation(prev => ({ ...prev, type: 'REGULAR' }));
                                    else setEditReservation(prev => ({ ...prev, type: 'COMMON' }));
                                }}
                                checked={editedReservation.type == 'REGULAR'}
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


interface member {
    memberId: number;
    name: string;
    nickname?: string;
    club?: string;
    enrollmentNumber?: string;
    role?: string[];
    profileImageUrl?: string;
}