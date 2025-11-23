import { useEffect, useRef, useState } from "react";
import type { AdminLevel, AdminSimple } from "../../types";

export function useManageAdminLevelState(admin: AdminSimple | null) {
  const openedMemberIdRef = useRef<number | null>(null);
  const levelAtOpenRef = useRef<AdminLevel>("SUB");
  const [level, setLevel] = useState<AdminLevel>("SUB");

  if (admin) {
    if (openedMemberIdRef.current !== admin.memberId) {
      openedMemberIdRef.current = admin.memberId;
      levelAtOpenRef.current =
        admin.adminLevel === "SUPER" || admin.adminLevel === "SUB"
          ? admin.adminLevel
          : "SUB";
    }
  } else {
    openedMemberIdRef.current = null;
  }

  useEffect(
    () => {
      if (!admin) return;
      setLevel(levelAtOpenRef.current);
    },
    // memberId만 추적 — admin 전체를 넣으면 목록 갱신 시 라디오가 초기화됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [admin?.memberId],
  );

  return {
    level,
    setLevel,
    levelWhenOpened: admin ? levelAtOpenRef.current : "SUB",
  };
}
