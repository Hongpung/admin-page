"use client";

import ToggleSwitch from "@admin/shared/components/ToggleSwitch";
import { useFormContext } from "react-hook-form";
import {
  reservationGhostButtonStyle,
  reservationInputStyle,
} from "../../constants/constants";
import type { AddBatchReservationFormValues } from "../../types/schemas";

type Props = {
  onCreatorModalOpen: () => void;
};

const dirtyValidateOptions = {
  shouldDirty: true,
  shouldValidate: true,
};

export function BatchReservationOwnerSection({
  onCreatorModalOpen,
}: Props) {
  const { register, setValue, watch } =
    useFormContext<AddBatchReservationFormValues>();
  const reservationType = watch("reservationType");
  const creatorId = watch("creatorId");
  const creatorDisplayName = watch("creatorDisplayName");

  return (
    <>
      <div className="flex-row flex justify-between items-center">
        외부 예약
        <div className="flex flex-row gap-2 items-center">
          {reservationType === "EXTERNAL" ? "예" : "아니오"}
          <ToggleSwitch
            name="switch"
            checked={reservationType === "EXTERNAL"}
            onCheckedChange={(next) => {
              setValue(
                "reservationType",
                next ? "EXTERNAL" : "COMMON",
                dirtyValidateOptions,
              );
              setValue("creatorId", undefined, dirtyValidateOptions);
              setValue("creatorDisplayName", "", dirtyValidateOptions);
              setValue("creatorName", "", dirtyValidateOptions);
            }}
          />
        </div>
      </div>

      {reservationType !== "EXTERNAL" && (
        <div className="flex-row flex justify-between items-center">
          정규 연습
          <div className="flex flex-row gap-2 items-center">
            {reservationType === "REGULAR" ? "예" : "아니오"}
            <ToggleSwitch
              name="reservationType"
              checked={reservationType === "REGULAR"}
              onCheckedChange={(next) => {
                setValue(
                  "reservationType",
                  next ? "REGULAR" : "COMMON",
                  dirtyValidateOptions,
                );
              }}
            />
          </div>
        </div>
      )}

      {reservationType !== "EXTERNAL" ? (
        <div className="flex-row flex justify-between items-center">
          예약자
          {creatorId != null ? (
            <div className="flex flex-row gap-2 items-center">
              {creatorDisplayName}
              <button
                type="button"
                className={reservationGhostButtonStyle}
                onClick={onCreatorModalOpen}
              >
                변경
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={reservationGhostButtonStyle}
              onClick={onCreatorModalOpen}
            >
              멤버 선택
            </button>
          )}
        </div>
      ) : (
        <div className="flex-row flex justify-between items-center">
          외부 예약자
          <input
            {...register("creatorName")}
            required
            placeholder="외부 예약자 입력"
            className={`${reservationInputStyle} max-w-xs`}
          />
        </div>
      )}
    </>
  );
}
