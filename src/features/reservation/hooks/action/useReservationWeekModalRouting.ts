"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "zustand/react";
import { useReservationWeekUiStore } from "../../provider/ReservationWeekUiContext";

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

  useEffect(() => {
    const detailParam = searchParams.get("detail");
    if (!detailParam) {
      if (modal === "Edit") store.getState().close();
      return;
    }

    const parsed = Number(detailParam);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      if (modal === "Edit") store.getState().close();
      return;
    }

    if (modal !== "Edit" || editReservationId !== parsed) {
      store.getState().openEdit(parsed);
    }
  }, [editReservationId, modal, searchParams, store]);

  const closeModal = useCallback(() => {
    close();
    if (modal === "Edit") updateDetailQuery(null);
  }, [close, modal, updateDetailQuery]);

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
