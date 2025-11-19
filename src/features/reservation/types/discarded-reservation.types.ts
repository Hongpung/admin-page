export type DiscardedReservationDiscardReason =
  | "NO_SHOW"
  | "ADMIN_FORCE_DISCARD"
  | "SYSTEM_RECOVERY";

export type DiscardedReservationClubSnapshot = {
  clubId: number;
  clubName: string;
};

export type DiscardedReservationRoleSnapshot = {
  roleAssignmentId: number;
  role: string;
  clubId: number | null;
};

export type DiscardedReservationMemberSnapshot = {
  memberId: number;
  name: string;
  nickname: string | null;
  email: string;
  enrollmentNumber: string;
  club: DiscardedReservationClubSnapshot | null;
  roles: DiscardedReservationRoleSnapshot[];
};

export type DiscardedReservationSnapshot = {
  reservationId: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  reservationType: string;
  participationAvailable: boolean;
  creatorId: number | null;
  externalCreatorName: string | null;
  creatorSnapshot: DiscardedReservationMemberSnapshot | null;
  participators: DiscardedReservationMemberSnapshot[];
  borrowInstruments: Record<string, number>[];
  policy: {
    graceMinutes: number;
  };
};

export interface DiscardedReservationItem {
  discardedReservationId: number;
  reservationId: number;
  discardedByType: "SYSTEM" | "ADMIN";
  discardReason: DiscardedReservationDiscardReason;
  reservation: DiscardedReservationSnapshot;
  createdAt: string;
}

export interface DiscardedReservationListResponse {
  items: DiscardedReservationItem[];
  total: number;
}
