"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import {
  buildReservationFormValuesFromDetail,
  editReservationDefaultValues,
} from "../../lib/reservation-form-values";
import {
  type ReservationDetailForEdit,
  reservationFormSchema,
  type ReservationFormValues,
} from "../../types/schemas";

export function useEditReservationFormState() {
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: editReservationDefaultValues,
    mode: "onSubmit",
  });
  const { reset, setValue } = form;

  const resetFormState = useCallback(() => {
    reset(editReservationDefaultValues);
  }, [reset]);

  const resetWithReservationDetail = useCallback(
    (reservation: ReservationDetailForEdit) => {
      reset(buildReservationFormValuesFromDetail(reservation));
    },
    [reset],
  );

  const setCreatorId = useCallback(
    (creatorId: number) => {
      setValue("creatorId", creatorId, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  return {
    form,
    resetFormState,
    resetWithReservationDetail,
    setCreatorId,
  };
}
