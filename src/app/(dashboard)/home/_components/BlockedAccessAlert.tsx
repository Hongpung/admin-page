"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function BlockedAccessAlert() {
  const shownRef = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (shownRef.current) return;
    if (searchParams.get("blocked") !== "1") return;

    shownRef.current = true;
    window.alert("비정상 접근 로직");

    const next = new URLSearchParams(searchParams.toString());
    next.delete("blocked");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
