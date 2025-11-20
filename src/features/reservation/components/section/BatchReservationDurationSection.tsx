"use client";

import { useFormContext } from "react-hook-form";
import { reservationInputStyle } from "../../constants/constants";
import type { AddBatchReservationFormValues } from "../../types/schemas";

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function BatchReservationDurationSection() {
  const { register, watch } = useFormContext<AddBatchReservationFormValues>();
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  const dayAfterTomorrow = new Date(
    new Date().getTime() + 2 * 24 * 60 * 60 * 1000,
  );
  const maxEndDate = new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000);

  return (
    <>
      <div className="flex-row flex justify-between">
        시작 날짜
        <input
          {...register("startDate")}
          type="date"
          min={toIsoDate(tomorrow)}
          max={endDate ? addDays(endDate, -1) : ""}
          required
          className={`${reservationInputStyle} max-w-xs`}
        />
      </div>

      <div className="flex-row flex justify-between">
        종료 날짜
        <input
          {...register("endDate")}
          type="date"
          min={startDate ? addDays(startDate, 1) : toIsoDate(dayAfterTomorrow)}
          max={toIsoDate(maxEndDate)}
          required
          className={`${reservationInputStyle} max-w-xs`}
        />
      </div>
    </>
  );
}
