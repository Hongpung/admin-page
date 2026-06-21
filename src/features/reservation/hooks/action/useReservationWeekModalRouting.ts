"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "zustand/react";
import { useReservationWeekUiStore } from "../../provider/ReservationWeekUiContext";
import { syncReservationModalFromDetailQuery } from "./sync-reservation-modal-from-detail-query";

export function useReservationWeekModalRouting() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const store = useReservationWeekUiStore();
  const modal = useStore(store, (s) => s.modal);
  const editReservationId = useStore(store, (s) => s.editReservationId);
  const close = useStore(store, (s) => s.close);

  const updateDetailQuery = useCallback(
    (detailId: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (detailId == null) params.delete("detail");
      else params.set("detail", String(detailId));

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const detailQuery = searchParams.get("detail");
  const detailQueryKey = searchParams.toString();

  useEffect(() => {
    if (store.getState().consumeDetailSyncSuppress()) {
      return;
    }
    syncReservationModalFromDetailQuery(store, detailQuery);
  }, [detailQuery, detailQueryKey, store]);

  const closeModal = useCallback(() => {
    const currentModal = store.getState().modal;
    if (currentModal === "Edit") {
      updateDetailQuery(null);
    }
    close();
  }, [close, store, updateDetailQuery]);

  const openCreateModal = useCallback(() => {
    updateDetailQuery(null);
    store.getState().openCreate();
  }, [store, updateDetailQuery]);

  const openBatchModal = useCallback(() => {
    updateDetailQuery(null);
    store.getState().openBatch();
  }, [store, updateDetailQuery]);

  return {
    modal,
    editReservationId,
    closeModal,
    openCreateModal,
    openBatchModal,
  };
}
