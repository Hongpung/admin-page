import { useCallback, useState } from "react";
import type { BannerDTO } from "../../types";

export type BannerModalState =
  | { state: "Create"; banner?: undefined }
  | { state: "Update"; banner: BannerDTO }
  | null;

export function useBannerManageState() {
  const [modalState, setModalState] = useState<BannerModalState>(null);

  const openCreateModal = useCallback(() => {
    setModalState({ state: "Create" });
  }, []);

  const openUpdateModal = useCallback((banner: BannerDTO) => {
    setModalState({ state: "Update", banner });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(null);
  }, []);

  return {
    modalState,
    openCreateModal,
    openUpdateModal,
    closeModal,
  };
}
