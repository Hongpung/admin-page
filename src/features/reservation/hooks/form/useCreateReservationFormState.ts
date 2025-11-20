"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { createReservationDefaultValues } from "../../lib/reservation-form-values";
import {
  reservationFormSchema,
  type ReservationFormValues,
} from "../../types/schemas";

export function useCreateReservationFormState() {
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: createReservationDefaultValues,
    mode: "onSubmit",
  });
  const { reset, setValue } = form;

  const resetFormState = useCallback(() => {
    reset(createReservationDefaultValues);
  }, [reset]);

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
    setCreatorId,
  };
}
