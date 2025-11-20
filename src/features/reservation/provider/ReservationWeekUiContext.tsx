"use client";

import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import {
  createReservationWeekUiStore,
  type ReservationWeekUiStore,
} from "../store/reservation-week-ui-store";

const ReservationWeekUiStoreContext =
  createContext<ReservationWeekUiStore | null>(null);

export function ReservationWeekUiProvider({
  children,
}: {
  children: ReactNode;
}) {
  const ref = useRef<ReservationWeekUiStore | null>(null);
  if (ref.current == null) {
    ref.current = createReservationWeekUiStore();
  }
  return (
    <ReservationWeekUiStoreContext.Provider value={ref.current}>
      {children}
    </ReservationWeekUiStoreContext.Provider>
  );
}

/** `/reservation/live/weeks` 트리 안에서만 사용 */
export function useReservationWeekUiStore(): ReservationWeekUiStore {
  const store = useContext(ReservationWeekUiStoreContext);
  if (!store) {
    throw new Error(
      "useReservationWeekUiStore는 ReservationWeekUiProvider 하위에서만 사용할 수 있습니다."
    );
  }
  return store;
}

/** Provider 밖(예: 홈 대시보드)에서는 `null` */
export function useOptionalReservationWeekUiStore(): ReservationWeekUiStore | null {
  return useContext(ReservationWeekUiStoreContext);
}
