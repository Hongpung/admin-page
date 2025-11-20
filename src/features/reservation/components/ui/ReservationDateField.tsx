"use client";

import { useFormContext } from "react-hook-form";
import { reservationInputStyle } from "../../constants/constants";
import type { ReservationFormValues } from "../../types/schemas";

export function ReservationDateField() {
  const { register } = useFormContext<ReservationFormValues>();

  return (
    <div className="flex flex-row items-center justify-between">
      <span className="shrink-0">날짜</span>
      <input
        {...register("date")}
        type="date"
        required
        className={`${reservationInputStyle} max-w-xs w-full`}
      />
    </div>
  );
}
