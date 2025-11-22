// TODO: 동아리 목록은 API 조회로 대체해서 옵션/clubId 매핑을 동기화해야 합니다.
export const MANAGE_USER_CLUB_OPTIONS = [
  { value: "none", label: "무소속" },
  { value: "0", label: "들녘" },
  { value: "1", label: "산틀" },
  { value: "2", label: "악반" },
  { value: "3", label: "신명화랑" },
] as const;
