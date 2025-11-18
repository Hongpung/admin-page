export type SessionBorrowInstrument = {
  imageUrl?: string | null;
  name: string;
  instrumentType: string;
  club?: string;
};

/** 출석·참가 행 (앱 MyPracticeInfo와 동일한 status 문자열) */
export type SessionAttendanceStatusLabel = "출석" | "지각" | "결석" | "참가";

export type SessionAttendanceMember = {
  memberId: number | string;
  name: string;
  nickname?: string | null;
};

export type SessionAttendanceEntry = {
  status: SessionAttendanceStatusLabel;
  timeStamp?: string | null;
  member: SessionAttendanceMember;
};

/** `admin/session-log` 일별·상세 응답에 맞춘 클라이언트 세션 타입 */
export interface Session {
  sessionId: number;
  date: string;
  title: string;
  reservationType: string | null;
  sessionType: string;
  participationAvailable: boolean;
  creatorName: string;
  creatorNickname?: string | null;
  startTime: string;
  endTime: string;
  forceEnd: boolean;
  extendCount: number;
  borrowInstruments: SessionBorrowInstrument[];
  returnImageUrl: string[] | null;
  /** 일별 목록 또는 specific 상세에 포함될 수 있음 */
  attendanceList?: SessionAttendanceEntry[];
}

export type SessionCalendarDay = {
  date: string;
  sessionCount: number;
};
