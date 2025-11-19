import type { TimeFormat } from "../constants/constants";

export type ReservationType = "COMMON" | "REGULAR" | "EXTERNAL";

export interface DateReservation {
  amountOfParticipators: number;
  reservationId: number;
  creatorName: string;
  creatorNickname: string;
  date: string;
  startTime: TimeFormat;
  endTime: TimeFormat;
  title: string;
  reservationType: ReservationType;
  participationAvailable: boolean;
}

export interface NewReservation {
  creatorId?: number;
  creatorName?: string;
  creatorNickname?: string;
  date?: string;
  reservationType: ReservationType;
  startTime?: TimeFormat;
  endTime?: TimeFormat;
  title?: string;
  participationAvailable: boolean;
}

export interface EditReservation {
  reservationId: number;
  creatorId?: number;
  creatorName?: string;
  creatorNickname?: string;
  date: string;
  reservationType: ReservationType;
  startTime?: TimeFormat;
  endTime?: TimeFormat;
  title: string;
  participationAvailable: boolean;
}

export interface ExistReservation {
  reservationId: number;
  creatorName: string;
  startTime: TimeFormat;
  endTime: TimeFormat;
  title: string;
  reservationType: ReservationType;
}

export interface OccupiedReservation extends ExistReservation {
  range: TimeFormat[];
}
