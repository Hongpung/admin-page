"use client";

import ToggleSwitch from "@admin/shared/components/ToggleSwitch";
import { useFormContext } from "react-hook-form";
import { RESERVATION_LABEL } from "../../constants/reservation-label.constants";
import type { ReservationFormValues } from "../../types/schemas";

type Props = {
  titlePlaceholder?: string;
};

export function ReservationOptionsSection({ titlePlaceholder }: Props) {
  const { register, setValue, watch } = useFormContext<ReservationFormValues>();
  const reservationType = watch("reservationType");
  const participationAvailable = watch("participationAvailable");

  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <span className="text-left">{RESERVATION_LABEL.practiceTitle}</span>
        <input
          {...register("title")}
          required
          placeholder={titlePlaceholder}
          className="max-w-xs w-full rounded border px-2 py-1 text-left focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {reservationType !== "EXTERNAL" && (
        <div className="flex flex-row items-center justify-between">
          <span className="text-left">{RESERVATION_LABEL.regularPractice}</span>
          <div className="flex flex-row items-center gap-2">
            {reservationType === "REGULAR" ? RESERVATION_LABEL.yes : RESERVATION_LABEL.no}
            <ToggleSwitch
              name="reservationType"
              checked={reservationType === "REGULAR"}
              onCheckedChange={(next) => {
                setValue("reservationType", next ? "REGULAR" : "COMMON", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-row items-center justify-between">
        <span className="text-left">{RESERVATION_LABEL.openPractice}</span>
        <div className="flex flex-row items-center gap-2">
          {participationAvailable ? RESERVATION_LABEL.yes : RESERVATION_LABEL.no}
          <ToggleSwitch
            name="participationAvailable"
            checked={participationAvailable}
            onCheckedChange={(next) =>
              setValue("participationAvailable", next, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>
      </div>
    </>
  );
}
