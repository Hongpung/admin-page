export interface Member {
  memberId: number;
  name: string;
  nickname?: string;
  club?: string;
  enrollmentNumber?: string;
  role?: string[];
  profileImageUrl?: string;
}

export interface SearchMembersResponse {
  members: Member[];
  total: number;
  page: number;
  pageSize: number;
}
