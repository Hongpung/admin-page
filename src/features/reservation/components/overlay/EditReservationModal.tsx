"use client";

import { useQuery } from "@tanstack/react-query";
import Modal from "@admin/shared/components/Modal";
import { FormProvider } from "react-hook-form";
import {
  reservationDangerButtonStyle,
  reservationPrimaryButtonStyle,
  reservationSecondaryButtonStyle,
} from "../../constants/constants";
import { RESERVATION_MESSAGE } from "../../constants/reservation-message.constants";
import { reservationDetailQueryOptions } from "../../queries";
import {
  useEditReservationAction,
  useReservationQueryErrorAlert,
} from "../../hooks/action";
import {
  useEditReservationFormHydration,
  useEditReservationFormState,
  useReservationCreatorFormSelect,
  useReservationFormCloseGuard,
} from "../../hooks/form";
import { useReservationCreatorSelector } from "../../hooks/state";
import { CreatorSelectModal } from "./CreatorSelectModal";
import { EditReservationFormSkeleton } from "../section/EditReservationFormSkeleton";
import { EditReservationFormSections } from "../section/EditReservationFormSections";

export function EditReservationModal({
  visible,
  reservationId,
  onClose,
}: {
  visible: boolean;
  reservationId: number;
  onClose: () => void;
}) {
  const {
    modalState,
    setModalState,
    selectedCreator,
    setCreator,
    resetCreatorState,
  } = useReservationCreatorSelector();

  const { form, resetWithReservationDetail, setCreatorId } =
    useEditReservationFormState();

  const { formState, handleSubmit } = form;

  const reservationDetailQuery = useQuery({
    ...reservationDetailQueryOptions(reservationId),
    enabled: visible,
  });

  const detailReady = visible && reservationDetailQuery.isSuccess;

  const { tryDeleteReservation, tryEditReservation } =
    useEditReservationAction({
    reservationId,
    onSuccess: onClose,
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
  });

  useEditReservationFormHydration({
    visible,
    reservation: reservationDetailQuery.data,
    resetWithReservationDetail,
    setCreator,
    resetCreatorState,
  });

  useReservationQueryErrorAlert({
    isError: visible && reservationDetailQuery.isError,
    message: RESERVATION_MESSAGE.detailLoadFailed,
    onAfterAlert: onClose,
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
        <div className="font-bold text-lg">예약 수정</div>
        {!detailReady ? (
          <EditReservationFormSkeleton />
        ) : (
          <form
            key={reservationId}
            className="flex flex-col"
            onSubmit={handleSubmit(tryEditReservation)}
          >
            <EditReservationFormSections
              reservationId={reservationId}
              onCreatorModalOpen={() => setModalState("Creator")}
              selectedCreator={selectedCreator}
            />
            <div className="flex flex-row flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleCloseAttempt}
                className={reservationSecondaryButtonStyle}
              >
                닫기
              </button>
              <div className="flex flex-row flex-wrap gap-2">
                <button
                  type="button"
                  onClick={tryDeleteReservation}
                  className={reservationDangerButtonStyle}
                >
                  삭제
                </button>
                <button type="submit" className={reservationPrimaryButtonStyle}>
                  수정
                </button>
              </div>
            </div>
          </form>
        )}
      </FormProvider>
    </Modal>
  );
}
