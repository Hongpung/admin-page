"use client";

import ToggleSwitch from "@admin/shared/components/ToggleSwitch";
import { useFormContext } from "react-hook-form";
import {
  reservationGhostButtonStyle,
  reservationInputStyle,
} from "../../constants/constants";
import type { ReservationFormValues } from "../../types/schemas";

export type ReservationCreator = {
  creatorId?: number;
  creatorName?: string;
  creatorNickname?: string;
};

type Props = {
  onCreatorModalOpen: () => void;
  selectedCreator?: ReservationCreator;
};

export function ReservationOwnerSection({
  onCreatorModalOpen,
  selectedCreator,
}: Props) {
  const { register, setValue, watch } = useFormContext<ReservationFormValues>();
  const reservationType = watch("reservationType");

  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <span className="text-left">외부 예약</span>
        <div className="flex flex-row items-center gap-2">
          {reservationType === "EXTERNAL" ? "예" : "아니오"}
          <ToggleSwitch
            name="switch"
            checked={reservationType === "EXTERNAL"}
            onCheckedChange={(next) => {
              setValue("reservationType", next ? "EXTERNAL" : "COMMON", {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />
        </div>
      </div>

      {reservationType !== "EXTERNAL" ? (
        <div className="flex flex-row items-center justify-between gap-4">
          예약자
          {selectedCreator?.creatorId ? (
            <div className="flex flex-row items-center gap-2 max-w-xs w-full">
              <span className="flex-1 text-right truncate">
                {selectedCreator.creatorName}{" "}
                {selectedCreator.creatorNickname?.trim() &&
                  `(${selectedCreator.creatorNickname})`}
              </span>
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
        <div className="flex flex-row items-center justify-between gap-4">
          <span className="text-left">외부 예약자</span>
          <input
            {...register("externalCreatorName")}
            required
            placeholder="외부 예약자 입력"
            className={`${reservationInputStyle} max-w-xs w-full text-left`}
          />
        </div>
      )}
    </>
  );
}
