export type AdminLevel = "SUPER" | "SUB";

export type AdminSimple = {
  memberId: number;
  name: string;
  nickname: string | null;
  club: string | null;
  enrollmentNumber: number;
  adminLevel: AdminLevel | null;
};

export type AdminListRes = {
  admins: AdminSimple[];
};

export type AdminMutationRes = {
  message: string;
  admin: AdminSimple;
};

export type AdminSessionRes = {
  memberId: number | null;
  adminLevel: AdminLevel | null;
  expiresInSeconds: number;
};
