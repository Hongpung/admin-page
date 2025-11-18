import { useCallback, useState } from "react";

export function useSessionAttendanceModalOpenState() {
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  const openAttendanceModal = useCallback(() => {
    setIsAttendanceOpen(true);
  }, []);

  const closeAttendanceModal = useCallback(() => {
    setIsAttendanceOpen(false);
  }, []);

  return {
    isAttendanceOpen,
    closeAttendanceModal,
    openAttendanceModal,
  };
}
