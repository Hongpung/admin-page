"use client";

import Modal from "@admin/shared/components/Modal";
import { useCallback } from "react";
import { FormProvider } from "react-hook-form";
import {
  reservationPrimaryButtonStyle,
  reservationSecondaryButtonStyle,
} from "../../constants/constants";
import { useCreateReservationAction } from "../../hooks/action";
import {
  useCreateReservationFormState,
  useReservationCreatorFormSelect,
  useReservationFormCloseGuard,
} from "../../hooks/form";
import { useReservationCreatorSelector } from "../../hooks/state";
import { CreatorSelectModal } from "./CreatorSelectModal";
import { CreateReservationFormSections } from "../section/CreateReservationFormSections";

export function CreateReservationModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const {
    modalState,
    setModalState,
    selectedCreator,
    setCreator,
    resetCreatorState,
  } = useReservationCreatorSelector();

  const { form, resetFormState, setCreatorId } =
    useCreateReservationFormState();

  const { formState, handleSubmit } = form;

  const resetModalState = useCallback(() => {
    resetCreatorState();
    resetFormState();
  }, [resetCreatorState, resetFormState]);

  const { tryCreateReservation } = useCreateReservationAction({
    onSuccess: () => {
      onClose();
      resetModalState();
    },
  });
  const { handleCreatorSelect } = useReservationCreatorFormSelect({
    setCreator,
    setCreatorId,
  });

  const { handleCloseAttempt } = useReservationFormCloseGuard({
    modalState,
    setModalState,
    isDirty: formState.isDirty,
    onClose,
    onReset: resetModalState,
  });

  return (
    <Modal isOpen={visible} onClose={handleCloseAttempt}>
      <FormProvider {...form}>
        {modalState == "Creator" && (
          <CreatorSelectModal
            onClose={() => setModalState("None")}
            visible={modalState == "Creator"}
            creatorId={selectedCreator?.creatorId}
            setCreator={handleCreatorSelect}
          />
        )}
        <div className="font-bold text-lg">예약 생성</div>
        <form
          className="flex flex-col"
          onSubmit={handleSubmit(tryCreateReservation)}
        >
          <CreateReservationFormSections
            onCreatorModalOpen={() => setModalState("Creator")}
            selectedCreator={selectedCreator}
          />
          <div className="flex flex-row justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handleCloseAttempt}
              className={reservationSecondaryButtonStyle}
            >
              닫기
            </button>
            <button type="submit" className={reservationPrimaryButtonStyle}>
              생성
            </button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
}
