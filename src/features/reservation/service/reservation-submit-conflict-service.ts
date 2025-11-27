import type { TimeFormat } from "../constants/constants";
import { buildOccupiedStateFromReservations } from "../lib/occupied-times";
import { findOverlappingReservations } from "../lib/reservation-conflict";
import type {
  ExistReservation,
  OccupiedReservation,
} from "../types";
import type { ReservationFormValues } from "../types/schemas";

type ConflictArgs = {
  values: ReservationFormValues;
  reservations: ExistReservation[];
  excludeReservationId?: number;
};

/**
 * 제출 직전 최신 예약 목록 기준으로 시간 충돌 목록을 계산합니다.
 */
export function collectSubmitConflicts({
  values,
  reservations,
  excludeReservationId,
}: ConflictArgs): OccupiedReservation[] {
  if (!values.startTime || !values.endTime) return [];

  const { existReservations } = buildOccupiedStateFromReservations(
    reservations,
    excludeReservationId,
  );

  return (
    findOverlappingReservations(
      values.startTime as TimeFormat,
      values.endTime as TimeFormat,
      existReservations,
      excludeReservationId,
    ) ?? []
  );
}
