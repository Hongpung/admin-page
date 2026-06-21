"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReservationWeekUiStore } from "../../store/reservation-week-ui-store";

type Args = {
  fallbackPath?: string;
  /** 주간 예약 Provider 안에서는 스토어를 넘겨 클릭 즉시 모달을 연다 */
  store?: ReservationWeekUiStore;
};

export function useReservationDetailNavigation({
  fallbackPath,
  store,
}: Args = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openReservationDetail = useCallback(
    (reservationId: number) => {
      const state = store?.getState();
      if (
        state &&
        state.modal !== "Create" &&
        state.modal !== "CreateBatch"
      ) {
        state.openEdit(reservationId);
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("detail", String(reservationId));
      const query = params.toString();
      const path = fallbackPath ?? pathname;

      router.push(query ? `${path}?${query}` : path, { scroll: false });
    },
    [fallbackPath, pathname, router, searchParams, store],
  );

  return { openReservationDetail };
}
