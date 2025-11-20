"use client";

import { useEffect, useRef } from "react";

type Args = {
  isError: boolean;
  message: string;
  onAfterAlert?: () => void;
};

export function useReservationQueryErrorAlert({
  isError,
  message,
  onAfterAlert,
}: Args) {
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!isError) {
      notifiedRef.current = false;
      return;
    }
    if (notifiedRef.current) return;

    notifiedRef.current = true;
    alert(message);
    onAfterAlert?.();
  }, [isError, message, onAfterAlert]);
}
