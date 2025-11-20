"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Args = {
  fallbackPath?: string;
};

export function useReservationDetailNavigation({
  fallbackPath,
}: Args = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openReservationDetail = useCallback(
    (reservationId: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("detail", String(reservationId));
      const query = params.toString();
      const path = fallbackPath ?? pathname;

      router.push(query ? `${path}?${query}` : path, { scroll: false });
    },
    [fallbackPath, pathname, router, searchParams],
  );

  return { openReservationDetail };
}
