"use client";

import { useEffect } from "react";
import type { ReservationDetailForEdit } from "../../types/schemas";

type CreatorSelect = {
  userId: number;
  userName: string;
  userNickname?: string;
};

type Args = {
  visible: boolean;
  reservation?: ReservationDetailForEdit;
  resetWithReservationDetail: (reservation: ReservationDetailForEdit) => void;
  setCreator: (user: CreatorSelect) => void;
  resetCreatorState: () => void;
};

export function useEditReservationFormHydration({
  visible,
  reservation,
  resetWithReservationDetail,
  setCreator,
  resetCreatorState,
}: Args) {
  useEffect(() => {
    if (!visible || !reservation) return;

    resetWithReservationDetail(reservation);
    if (reservation.creatorId) {
      setCreator({
        userId: reservation.creatorId,
        userName: reservation.creatorName ?? "",
        userNickname: reservation.creatorNickname ?? "",
      });
      return;
    }

    resetCreatorState();
  }, [
    reservation,
    resetCreatorState,
    resetWithReservationDetail,
    setCreator,
    visible,
  ]);
}
