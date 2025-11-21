export const ROLE_MAP = {
  LEADER: "패짱",
  SANGSOE: "상쇠",
  SANGJANGGU: "상장구",
  SUBUK: "수북",
  SUBUGGU: "수법고",
} as const;

export type KoRole = (typeof ROLE_MAP)[keyof typeof ROLE_MAP];
export type RoleKey = keyof typeof ROLE_MAP;

export interface ClubMember {
  memberId: number;
  name: string;
  nickname?: string;
  email: string;
  enrollmentNumber: string;
  roleAssignment: string[];
  profileImageUrl: string;
  instagramUrl: string;
  blogUrl: string;
}

export interface ClubPrimaryMember extends ClubMember {
  updatedAt: string;
}

export interface ClubInfoRoleItem {
  role: string;
  member: ClubMember;
}

export interface ClubInfo {
  clubId: number;
  clubName: string;
  profileImage: string | null;
  roleData: ClubInfoRoleItem[];
}

export interface UpdateClubProfileRequest {
  profileImageUrl?: string | null;
  roleAssignments?: Partial<Record<KoRole, number | null>> | null;
}

export interface SearchMember {
  memberId: number;
  name: string;
  nickname?: string;
  club?: string;
  role?: string[];
}

export interface ClubDetailFormValues {
  clubId: number;
  clubName: string;
  file: File | null;
  profileImageUrl: string | null;
  roleAssignments: Partial<Record<KoRole, number | null>>;
  roleAssigneeNames: Partial<Record<KoRole, string | null>>;
}
