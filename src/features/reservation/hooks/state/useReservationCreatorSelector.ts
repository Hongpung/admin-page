import { useCallback, useState } from "react";

type SelectedCreator = {
  creatorId?: number;
  creatorName?: string;
  creatorNickname?: string;
};

export function useReservationCreatorSelector() {
  const [modalState, setModalState] = useState<"None" | "Creator">("None");
  const [selectedCreator, setSelectedCreator] = useState<SelectedCreator>();

  const setCreator = useCallback(
    (user: { userId: number; userName: string; userNickname?: string }) => {
      setSelectedCreator({
        creatorId: user.userId,
        creatorName: user.userName,
        creatorNickname: user.userNickname,
      });
    },
    [],
  );

  const resetCreatorState = useCallback(() => {
    setModalState("None");
    setSelectedCreator(undefined);
  }, []);

  return {
    modalState,
    setModalState,
    selectedCreator,
    setCreator,
    resetCreatorState,
  };
}
