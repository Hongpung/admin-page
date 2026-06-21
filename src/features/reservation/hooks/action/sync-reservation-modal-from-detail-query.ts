import type { ReservationWeekUiStore } from "../../store/reservation-week-ui-store";

export function syncReservationModalFromDetailQuery(
  store: ReservationWeekUiStore,
  detailParam: string | null,
): void {
  if (!detailParam) {
    if (store.getState().modal === "Edit") {
      store.getState().close();
    }
    return;
  }

  const parsed = Number(detailParam);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    store.getState().close();
    return;
  }

  const state = store.getState();
  if (state.modal === "Create" || state.modal === "CreateBatch") {
    return;
  }

  if (state.modal !== "Edit" || state.editReservationId !== parsed) {
    store.getState().openEdit(parsed);
  }
}
