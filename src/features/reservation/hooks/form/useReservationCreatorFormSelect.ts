"use client";

import { useCallback } from "react";

type CreatorSelect = {
  userId: number;
  userName: string;
  userNickname?: string;
};

type Args = {
  setCreator: (user: CreatorSelect) => void;
  setCreatorId: (creatorId: number) => void;
};

export function useReservationCreatorFormSelect({
  setCreator,
  setCreatorId,
}: Args) {
  const handleCreatorSelect = useCallback(
    (user: CreatorSelect) => {
      setCreator(user);
      setCreatorId(user.userId);
    },
    [setCreator, setCreatorId],
  );

  return { handleCreatorSelect };
}
