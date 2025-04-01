'use client'

import "@admin/app/globals.css";
import { useEffect, useState } from "react"
import { loadLatestSessions } from "./util"
import Image from "next/image";

interface Session {
    sessionId: number;
    date: string;
    title: string;
    reservationType: "REGULAR" | "COMMON";
    sessionType: "REALTIME" | "RESERVED";
    participationAvailable: boolean;
    creatorName: string;
    creatorNickname?: string;
    startTime: string;
    endTime: string;
    forceEnd: boolean
    extendCount: number
    borrowInstruments: Instrument[]
    returnImageUrl: string[] | null
}

type InstrumentType = '꽹과리' | '장구' | '북' | '소고' | '징' | '기타';
type Club = '들녘' | '산틀' | '신명화랑' | '악반' | '기타'

interface Instrument {
    instrumentId: number
    imageUrl?: string  // url
    name: string
    instrumentType: InstrumentType
    club: Exclude<Club, '기타'>
}
export default function SessionPage() {

    const [selectedSession, setSession] = useState<Session | null>(null)

    return (
        <div className="flex flex-row gap-8 h-full">
            <div className="flex flex-col border rounded-md py-3 overflow-hidden gap-6" style={{ minWidth: 460, minHeight: 600, maxHeight: 840 }}>
                <div className="font-semibold px-4 ">연습실 이용 내역</div>
                <SessionList onSelect={setSession} />
            </div>
            <div className="flex-1 h-dvh border rounded-md py-3 gap-6 min-w-min" >
                {selectedSession ?
                    <SessionInformation session={selectedSession} />
                    :
                    <div className="flex h-full w-full justify-center items-center">
                        <div className="font-semibold text-xl text-gray-300">
                            왼쪽에서 내역을 선택해주세요
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}

const SessionInformation: React.FC<{ session: Session }> = ({ session }) => {
    return (
        <div className="flex flex-col px-2 gap-8">
            <div className="font-semibold px-2">상세 내역</div>
            <div className="flex flex-col px-8 gap-8">
                <div>이용 시간</div>
                <div className="flex flex-row justify-around mx-8 py-8 rounded-md bg-gray-200">
                    <div className="flex flex-col items-center gap-4">
                        <div>
                            시작 시간
                        </div>
                        <div>
                            {session.startTime}
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div>
                            종료 시간
                        </div>
                        <div>
                            {session.endTime}
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div>
                            연장횟수
                        </div>
                        <div>
                            {session.extendCount}
                        </div>
                    </div>

                </div>
            </div>
            <div className="px-8 gap-8">
                <div>대여 악기</div>
                {session.borrowInstruments.length > 0 ?
                    session.borrowInstruments.map(instrument => (
                        <div key={instrument.instrumentId}>
                            {instrument.name}
                        </div>
                    )) :
                    <div className="text-center py-12 text-gray-300">
                        대여한 악기가 없습니다.
                    </div>
                }
            </div>
            <div className="flex flex-col px-8 gap-4">
                <div>종료 사진</div>
                {!session.forceEnd ?
                    session.returnImageUrl ?
                        <div className="flex flex-wrap gap-8 px-4">
                            {session.returnImageUrl.map((imageUrl, idx) => (
                                <Image key={idx} // React에서 리스트 렌더링 시 key 추가 필요
                                    src={imageUrl}
                                    alt={`${session.title}의 ${idx}번째`}
                                    width={200}
                                    height={200}
                                    style={{ objectFit: "cover", borderRadius: 15 }} // sizes 속성 대신 스타일 적용
                                    priority={true}
                                />
                            ))}
                        </div>
                        :
                        <div className="text-center py-12 text-gray-300">
                            사진이 존재하지 않습니다.
                        </div>
                    :
                    <div className="text-center py-12 text-gray-300">
                        강제 종료된 이용입니다.
                    </div>
                }
            </div>
        </div>
    )
}


function SessionList({ onSelect }: { onSelect: (session: Session | null) => void }) {

    const [page, setPage] = useState(0)
    const [sessionList, setSessionList] = useState<Session[]>([])

    const addPage = () => {
        setPage(prev => prev + 1)
    }

    useEffect(() => {
        const loadSessions = async () => {
            const loadedSessions = await loadLatestSessions(page) as Session[];
            console.log(loadedSessions)
            setSessionList(prev => [...prev, ...loadedSessions.filter(session => !prev.find(s => s.sessionId == session.sessionId))])
        }

        loadSessions()
    }, [page])

    return (
        <div className="flex flex-col h-full w-full overflow-y-auto">
            <div className="flex flex-col gap-4">
                {sessionList.map(session => (
                    <div key={session.sessionId}>
                        <SessionCard session={session} isBefore={false} onSelect={onSelect}></SessionCard>
                    </div>
                ))}
            </div>
            {sessionList.length == (page + 1) * 10 &&
                <div className="flex items-center justify-center h-12 cursor-pointer" onClick={addPage}>
                    <div className="font-regular text-lg text-gray-400">
                        addPage
                    </div>
                </div>}
        </div>
    )
}


interface SessionCardProps {
    session: Session;
    isBefore: boolean;
    onSelect: (session: Session | null) => void
}

const Color = {
    blue200: "#AECBFA",
    blue500: "#4285F4",
    green200: "#C3E6CB",
    green500: "#28A745",
    red200: "#F5C6CB",
    red500: "#DC3545",
    grey400: "#BDBDBD",
    grey600: "#757575",
    grey700: "#424242",
};

const SessionCard: React.FC<SessionCardProps> = ({ session, isBefore, onSelect }) => {
    const [year, month, date] = session.date.split('-')

    const borderColor =
        session.reservationType === "REGULAR"
            ? isBefore
                ? Color.blue200
                : Color.blue500
            : session.participationAvailable
                ? isBefore
                    ? Color.green200
                    : Color.green500
                : isBefore
                    ? Color.red200
                    : Color.red500;

    return (
        <div className={`bg-white mx-6 h-30 rounded-xl border-2 border-[${borderColor}] flex flex-col justify-between cursor-pointer`}
            onClick={() => { onSelect(session) }}
        >
            {/* 상단 영역 */}
            <div className="flex justify-between px-5 py-4 items-center">
                <div className={`flex flex-row gap-2 items-center font-bold text-lg text-[${isBefore ? Color.grey400 : Color.grey700}]`}>
                    {session.title.length > 10 ? session.title.slice(0, 7).trim() + '...' : session.title}{session.forceEnd &&
                        <span className="p-1 text-gray-500 bg-gray-300 rounded-sm text-xs font-medium">
                            강제 종료
                        </span>}
                </div>

                {/* 사용자 정보 */}
                <div className="text-right">
                    <p className="font-regular text-sm text-gray-600">{session.creatorName}</p>
                    {session.creatorNickname && (
                        <p className="font-regular text-xs text-gray-400">{session.creatorNickname}</p>
                    )}
                </div>
            </div>

            {/* 하단 영역 */}
            <div className="flex justify-between px-5 pb-3">
                <p className="font-light text-sm text-gray-400">
                    {Number(year)}년 {Number(month)}월 {Number(date)}일
                </p>

                <p className="font-light text-sm text-gray-400">
                    {session.startTime} ~ {session.endTime}
                </p>
            </div>

        </div>
    );
};