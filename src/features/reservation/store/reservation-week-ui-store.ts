import { createStore } from "zustand/vanilla";

export type ReservationWeekModal = "None" | "Create" | "CreateBatch" | "Edit";

export type ReservationWeekUiState = {
  modal: ReservationWeekModal;
  editReservationId: number | null;
  /** dismiss 직후 URL detail 동기화가 모달을 다시 열지 않도록 1회 억제 */
  suppressDetailSync: boolean;
  openCreate: () => void;
  openBatch: () => void;
  openEdit: (reservationId: number) => void;
  close: () => void;
  suppressNextDetailSync: () => void;
  consumeDetailSyncSuppress: () => boolean;
};

export function createReservationWeekUiStore() {
  return createStore<ReservationWeekUiState>((set, get) => ({
    modal: "None",
    editReservationId: null,
    suppressDetailSync: false,
    openCreate: () => set({ modal: "Create", editReservationId: null }),
    openBatch: () => set({ modal: "CreateBatch", editReservationId: null }),
    openEdit: (reservationId: number) =>
      set({ modal: "Edit", editReservationId: reservationId }),
    close: () => set({ modal: "None", editReservationId: null }),
    suppressNextDetailSync: () => set({ suppressDetailSync: true }),
    consumeDetailSyncSuppress: () => {
      const suppressed = get().suppressDetailSync;
      if (suppressed) set({ suppressDetailSync: false });
      return suppressed;
    },
  }));
}

export type ReservationWeekUiStore = ReturnType<
  typeof createReservationWeekUiStore
>;
