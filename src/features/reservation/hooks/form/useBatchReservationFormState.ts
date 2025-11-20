"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  addBatchReservationFormSchema,
  type AddBatchReservationFormValues,
} from "../../types/schemas";

export const addBatchReservationDefaultValues: AddBatchReservationFormValues = {
  title: "",
  reservationType: "EXTERNAL",
  creatorId: undefined,
  creatorName: "",
  creatorDisplayName: "",
  dayTimes: [],
  startDate: "",
  endDate: "",
};

export function useBatchReservationFormState() {
  const form = useForm<AddBatchReservationFormValues>({
    resolver: zodResolver(addBatchReservationFormSchema),
    defaultValues: addBatchReservationDefaultValues,
    mode: "onSubmit",
  });

  return { form };
}
