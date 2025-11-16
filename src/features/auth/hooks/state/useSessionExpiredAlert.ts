"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function useSessionExpiredAlert() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didShowExpiredAlertRef = useRef(false);

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason !== "session-expired" || didShowExpiredAlertRef.current) return;

    didShowExpiredAlertRef.current = true;
    window.alert(
      "세션이 만료되어 로그인이 해제되었습니다. 다시 로그인해주세요.",
    );

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("reason");
    const nextQuery = nextParams.toString();

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [pathname, router, searchParams]);
}
