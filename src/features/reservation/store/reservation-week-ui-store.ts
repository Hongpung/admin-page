import { createStore } from "zustand/vanilla";

export type ReservationWeekModal = "None" | "Create" | "CreateBatch" | "Edit";

export type ReservationWeekUiState = {
  modal: ReservationWeekModal;
  editReservationId: number | null;
  openCreate: () => void;
  openBatch: () => void;
  openEdit: (reservationId: number) => void;
  close: () => void;
};

export function createReservationWeekUiStore() {
  return createStore<ReservationWeekUiState>((set) => ({
    modal: "None",
    editReservationId: null,
    openCreate: () => set({ modal: "Create", editReservationId: null }),
    openBatch: () => set({ modal: "CreateBatch", editReservationId: null }),
    openEdit: (reservationId: number) =>
      set({ modal: "Edit", editReservationId: reservationId }),
    close: () => set({ modal: "None", editReservationId: null }),
  }));
}

export type ReservationWeekUiStore = ReturnType<
  typeof createReservationWeekUiStore
>;
