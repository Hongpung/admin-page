import { describe, expect, it } from "vitest";
import { createReservationWeekUiStore } from "../../store/reservation-week-ui-store";
import { syncReservationModalFromDetailQuery } from "./sync-reservation-modal-from-detail-query";

describe("syncReservationModalFromDetailQuery", () => {
  it("opens edit modal when detail query is present", () => {
    const store = createReservationWeekUiStore();

    syncReservationModalFromDetailQuery(store, "42");

    expect(store.getState().modal).toBe("Edit");
    expect(store.getState().editReservationId).toBe(42);
  });

  it("keeps edit modal closed after dismiss without another URL sync", () => {
    const store = createReservationWeekUiStore();
    syncReservationModalFromDetailQuery(store, "42");
    store.getState().close();

    expect(store.getState().modal).toBe("None");
    expect(store.getState().editReservationId).toBeNull();
  });

  it("does not reopen edit modal when detail sync is suppressed after dismiss", () => {
    const store = createReservationWeekUiStore();
    syncReservationModalFromDetailQuery(store, "42");
    store.getState().suppressNextDetailSync();
    store.getState().close();

    if (store.getState().consumeDetailSyncSuppress()) {
      expect(store.getState().modal).toBe("None");
      return;
    }

    syncReservationModalFromDetailQuery(store, "42");

    expect(store.getState().modal).toBe("None");
  });

  it("does not override create modal when detail query remains in the URL", () => {
    const store = createReservationWeekUiStore();
    store.getState().openCreate();

    syncReservationModalFromDetailQuery(store, "42");

    expect(store.getState().modal).toBe("Create");
  });

  it("closes edit modal when detail query is removed", () => {
    const store = createReservationWeekUiStore();
    syncReservationModalFromDetailQuery(store, "42");

    syncReservationModalFromDetailQuery(store, null);

    expect(store.getState().modal).toBe("None");
  });
});
