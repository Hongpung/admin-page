import { useEffect, useRef } from "react";
import type { User } from "../../types";

type Args = {
  user: User | null;
};

export function useManageUserRoleSnapshot({ user }: Args) {
  const openedMemberIdRef = useRef<number | null>(null);
  const rolesAtOpenRef = useRef<string[]>([]);

  const rolesWhenOpened = user ? rolesAtOpenRef.current : [];

  useEffect(() => {
    if (!user) {
      openedMemberIdRef.current = null;
      rolesAtOpenRef.current = [];
      return;
    }
    if (openedMemberIdRef.current === user.memberId) return;
    openedMemberIdRef.current = user.memberId;
    rolesAtOpenRef.current = [...user.role];
  }, [user]);

  return { rolesWhenOpened };
}
