/** OpenAPI: MemberListItemResDto — 회원 검색·목록 */
export type MemberListItemResDto = {
  memberId: number;
  name: string;
  nickname: string | null;
  email: string;
  enrollmentNumber: string;
  club: string | null;
  role: string[];
  profileImageUrl: string | null;
  instagramUrl: string | null;
  blogUrl: string | null;
};

/** 목록·검색 UI 호환 alias (MemberListItemResDto) */
export type User = MemberListItemResDto;

/** OpenAPI: SignupListResDto — 승인 대기 계정 */
export type SignupListResDto = {
  signupId: number;
  name: string;
  nickname: string | null;
  club: string | null;
  enrollmentNumber: string;
  email: string;
};

/** @deprecated SignupListResDto 사용 */
export type SignUpRequestUser = SignupListResDto;

/** OpenAPI: UpdateMemberByAdminReqDto */
export type UpdateMemberByAdminReqDto = {
  name?: string;
  nickname?: string | null;
  clubId?: number | null;
  email?: string;
  adminPassword?: string;
};

/** OpenAPI: MemberDetailResDto — 관리자 회원 수정 응답 */
export type MemberDetailResDto = {
  memberId: number;
  name: string;
  nickname: string | null;
  email: string;
  enrollmentNumber: string;
  club: string | null;
  role: string[];
  profileImageUrl: string | null;
  instagramUrl: string | null;
  blogUrl: string | null;
};

/** OpenAPI: MemberSearchPaginatedResDto */
export type MemberSearchPaginatedResDto = {
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  members: MemberListItemResDto[];
};
