"use client";

import { useCallback } from "react";
import { RESERVATION_MESSAGE } from "../../constants/reservation-message.constants";

type Args = {
  modalState: "None" | "Creator";
  setModalState: (next: "None" | "Creator") => void;
  isDirty: boolean;
  onClose: () => void;
  onReset?: () => void;
};

export function useReservationFormCloseGuard({
  modalState,
  setModalState,
  isDirty,
  onClose,
  onReset,
}: Args) {
  const handleCloseAttempt = useCallback(() => {
    if (modalState === "Creator") {
      setModalState("None");
      return;
    }

    if (!isDirty) {
      onReset?.();
      onClose();
      return;
    }

    if (confirm(RESERVATION_MESSAGE.closeConfirm)) {
      onReset?.();
      onClose();
    }
  }, [isDirty, modalState, onClose, onReset, setModalState]);

  return { handleCloseAttempt };
}
