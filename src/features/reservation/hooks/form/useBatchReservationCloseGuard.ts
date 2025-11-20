"use client";

import { useCallback } from "react";
import { RESERVATION_MESSAGE } from "../../constants/reservation-message.constants";

type Args = {
  modalState: "None" | "Creator";
  setModalState: (next: "None" | "Creator") => void;
  isDirty: boolean;
  onClose: () => void;
};

export function useBatchReservationCloseGuard({
  modalState,
  setModalState,
  isDirty,
  onClose,
}: Args) {
  const handleCloseAttempt = useCallback(() => {
    if (modalState === "Creator") {
      setModalState("None");
      return;
    }

    if (!isDirty) {
      onClose();
      return;
    }

    if (confirm(RESERVATION_MESSAGE.closeConfirm)) {
      onClose();
    }
  }, [isDirty, modalState, onClose, setModalState]);

  return { handleCloseAttempt };
}
