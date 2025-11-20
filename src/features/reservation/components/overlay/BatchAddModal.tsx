"use client";

import Modal from "@admin/shared/components/Modal";
import { useCallback, useState } from "react";
import {
  type FieldErrors,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import {
  reservationInputStyle,
  reservationPrimaryButtonStyle,
  reservationSecondaryButtonStyle,
} from "../../constants/constants";
import { useBatchReservationAction } from "../../hooks/action";
import {
  useBatchReservationCloseGuard,
  useBatchReservationFormState,
} from "../../hooks/form";
import type { AddBatchReservationFormValues } from "../../types/schemas";
import { BatchReservationDayTimesSection } from "../section/BatchReservationDayTimesSection";
import { BatchReservationDurationSection } from "../section/BatchReservationDurationSection";
import { BatchReservationOwnerSection } from "../section/BatchReservationOwnerSection";
import { CreatorSelectModal } from "./CreatorSelectModal";

const dirtyValidateOptions = {
  shouldDirty: true,
  shouldValidate: true,
};

function findFirstErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;

  if (
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  for (const value of Object.values(error)) {
    const nestedMessage = findFirstErrorMessage(value);
    if (nestedMessage) return nestedMessage;
  }

  return undefined;
}

function BatchReservationTitleField() {
  const { register } = useFormContext<AddBatchReservationFormValues>();

  return (
    <div className="flex-row flex justify-between">
      연습 제목
      <input
        {...register("title")}
        placeholder="연습 제목을 입력(모든 예약에 적용)"
        className={`${reservationInputStyle} max-w-xs`}
      />
    </div>
  );
}

export function BatchAddModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [modalState, setModalState] = useState<"None" | "Creator">("None");
  const { form } = useBatchReservationFormState();
  const { addBatch } = useBatchReservationAction({ onSuccess: onClose });

  const { handleCloseAttempt } = useBatchReservationCloseGuard({
    modalState,
    setModalState,
    isDirty: form.formState.isDirty,
    onClose,
  });

  const handleCreatorSelect = useCallback(
    ({ userId, userName }: { userId: number; userName: string }) => {
      if (form.getValues("reservationType") === "EXTERNAL") return;

      form.setValue("creatorId", userId, dirtyValidateOptions);
      form.setValue("creatorDisplayName", userName, dirtyValidateOptions);
    },
    [form],
  );

  const handleSubmitBatch = form.handleSubmit(
    (values) => {
      void addBatch(values);
    },
    (errors: FieldErrors<AddBatchReservationFormValues>) => {
      alert(findFirstErrorMessage(errors) ?? "입력을 확인해주세요");
    },
  );

  return (
    <Modal isOpen={isOpen} onClose={handleCloseAttempt}>
      <FormProvider {...form}>
        <div className="flex flex-col gap-4">
          {modalState == "Creator" && (
            <CreatorSelectModal
              onClose={() => setModalState("None")}
              visible={true}
              setCreator={handleCreatorSelect}
            />
          )}
          <div>정기 일정 추가</div>
          <form
            onSubmit={handleSubmitBatch}
            className="flex flex-col gap-4"
            noValidate
          >
            <BatchReservationOwnerSection
              onCreatorModalOpen={() => setModalState("Creator")}
            />
            <BatchReservationTitleField />
            <BatchReservationDayTimesSection />
            <BatchReservationDurationSection />
            <div className="flex flex-row justify-between gap-2 pt-2">
              <button
                type="button"
                className={reservationSecondaryButtonStyle}
                onClick={handleCloseAttempt}
              >
                닫기
              </button>
              <button type="submit" className={reservationPrimaryButtonStyle}>
                적용
              </button>
            </div>
          </form>
        </div>
      </FormProvider>
    </Modal>
  );
}
