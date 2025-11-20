"use client";

import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { reservationSelectStyle, TimeArray } from "../../constants/constants";
import type { TimeFormat } from "../../constants/constants";
import { RESERVATION_MESSAGE } from "../../constants/reservation-message.constants";
import {
  useReservationConflict,
  useReservationQueryErrorAlert,
} from "../../hooks/action";
import {
  useReservationTimeRangeHandlers,
  useReservationTimeRangeResetOnDateLoad,
} from "../../hooks/form";
import { useDailyOccupiedTimes } from "../../hooks/view-model";
import type { ReservationFormValues } from "../../types/schemas";

type Props = {
  excludeReservationId?: number;
  maxWidthClassName?: string;
  resetTimeRangeOnDateLoad?: "always" | "dirty" | "never";
};

export function ReservationTimeRangeField({
  excludeReservationId,
  maxWidthClassName = "max-w-xs",
  resetTimeRangeOnDateLoad = "always",
}: Props) {
  const { control, formState, register, setValue } =
    useFormContext<ReservationFormValues>();
  const [date, startTime, endTime] = useWatch({
    control,
    name: ["date", "startTime", "endTime"] as const,
  });

  const { occupiedTimes, existReservations, isSuccess, isError } =
    useDailyOccupiedTimes(date || undefined, excludeReservationId);
  const isConflict = useReservationConflict(
    existReservations,
    excludeReservationId,
  );
  const setStartTime = useCallback(
    (time: TimeFormat) => {
      setValue("startTime", time, { shouldDirty: true, shouldValidate: true });
    },
    [setValue],
  );
  const setEndTime = useCallback(
    (time: TimeFormat) => {
      setValue("endTime", time, { shouldDirty: true, shouldValidate: true });
    },
    [setValue],
  );
  const clearTimeRange = useCallback(() => {
    setValue("startTime", undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("endTime", undefined, { shouldDirty: true, shouldValidate: true });
  }, [setValue]);
  const { handleStartChange, handleEndChange } =
    useReservationTimeRangeHandlers({
      endTime,
      startTime,
      occupiedTimes,
      isConflict,
      setStartTime,
      setEndTime,
    });

  useReservationTimeRangeResetOnDateLoad({
    date,
    isLoaded: isSuccess,
    shouldReset:
      resetTimeRangeOnDateLoad === "always" ||
      (resetTimeRangeOnDateLoad === "dirty" && formState.isDirty),
    clearTimeRange,
  });
  useReservationQueryErrorAlert({
    isError,
    message: RESERVATION_MESSAGE.loadFailed,
  });

  const resolvedStartTime = (startTime || "10:00") as TimeFormat;
  const resolvedEndTime = (endTime || "22:00") as TimeFormat;

  return (
    <div className="flex flex-row items-center justify-between">
      <span className="shrink-0">연습 시간</span>
      <div
        className={`flex flex-row w-full items-center gap-4 ${maxWidthClassName}`}
      >
        <div className="flex-1">
          <select
            {...register("startTime", { onChange: handleStartChange })}
            className={`${reservationSelectStyle} w-full`}
            id="startTime"
          >
            <option disabled value="">
              시작 시간
            </option>
            {date ? (
              TimeArray.filter(
                (_, index) => index < TimeArray.indexOf(resolvedEndTime),
              ).map((time) => (
                <option
                  key={`start-${time}`}
                  value={time}
                  className={`w-full ${occupiedTimes?.includes(time) ? "text-gray-400" : ""}`}
                >
                  {time}
                </option>
              ))
            ) : (
              <option disabled className="w-full text-gray-400">
                날짜를 선택
              </option>
            )}
          </select>
        </div>
        ~
        <div className="flex-1">
          <select
            {...register("endTime", { onChange: handleEndChange })}
            className={`${reservationSelectStyle} w-full`}
            id="endTime"
          >
            <option disabled value="">
              종료 시간
            </option>
            {date ? (
              TimeArray.filter(
                (_, index) => index > TimeArray.indexOf(resolvedStartTime),
              ).map((time) => (
                <option
                  key={`end-${time}`}
                  value={time}
                  className={`w-full ${occupiedTimes?.includes(time) ? "text-gray-400" : ""}`}
                >
                  {time}
                </option>
              ))
            ) : (
              <option disabled className="w-full text-gray-400">
                날짜를 선택
              </option>
            )}
          </select>
        </div>
      </div>
    </div>
  );
}
