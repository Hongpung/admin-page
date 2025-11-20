"use client";

import { X } from "lucide-react";
import { useFormContext } from "react-hook-form";
import {
  reservationSelectStyle,
  TimeArray,
  weekdays_ko,
} from "../../constants/constants";
import type { TimeFormat, WeekDay } from "../../constants/constants";
import {
  appendBatchAddDayTime,
  removeBatchAddDayTime,
  updateBatchAddDayTime,
} from "../../lib/batch-add-state";
import type { AddBatchReservationFormValues } from "../../types/schemas";

const dirtyValidateOptions = {
  shouldDirty: true,
  shouldValidate: true,
};

export function BatchReservationDayTimesSection() {
  const { setValue, watch } = useFormContext<AddBatchReservationFormValues>();
  const dayTimes = watch("dayTimes") ?? [];

  const setDayTimes = (nextDayTimes: AddBatchReservationFormValues["dayTimes"]) => {
    setValue("dayTimes", nextDayTimes, dirtyValidateOptions);
  };

  return (
    <>
      <div className="flex flex-row justify-between">
        <div>요일 선택</div>
        <select
          className={`${reservationSelectStyle} max-w-xs`}
          defaultValue="default"
          onChange={(e) => {
            const weekday = e.currentTarget.value as WeekDay;
            setDayTimes(appendBatchAddDayTime(dayTimes, weekday));
            e.currentTarget.value = "default";
          }}
        >
          <option defaultChecked disabled value="default">
            요일 추가
          </option>
          {weekdays_ko
            .filter(
              (weekday) => !dayTimes.some((entry) => entry.day === weekday),
            )
            .map((weekday) => (
              <option key={weekday} value={weekday}>
                {weekday}
              </option>
            ))}
        </select>
      </div>

      <div className="py-4 rounded-md bg-gray-200 flex flex-col gap-4 px-2 ">
        {dayTimes.map((data, index) => (
          <div className="flex flex-row justify-between" key={data.day}>
            <div>{data.day}요일</div>
            <div className="flex flex-row gap-4">
              <div className="w-24">
                <select
                  className={`${reservationSelectStyle} w-full`}
                  value={data.startTime || "default"}
                  onChange={(e) =>
                    setDayTimes(
                      updateBatchAddDayTime(
                        dayTimes,
                        index,
                        "startTime",
                        e.currentTarget.value as TimeFormat,
                      ),
                    )
                  }
                >
                  <option disabled value="default">
                    시작 시간
                  </option>
                  {TimeArray.filter(
                    (_, i) => i < TimeArray.indexOf(data.endTime || "22:00"),
                  ).map((time) => (
                    <option key={`start-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              ~
              <div className="w-24">
                <select
                  className={`${reservationSelectStyle} w-full`}
                  value={data.endTime || "default"}
                  onChange={(e) =>
                    setDayTimes(
                      updateBatchAddDayTime(
                        dayTimes,
                        index,
                        "endTime",
                        e.currentTarget.value as TimeFormat,
                      ),
                    )
                  }
                >
                  <option disabled value="default" className="bg-gray-200">
                    종료 시간
                  </option>
                  {TimeArray.filter(
                    (_, i) => i > TimeArray.indexOf(data.startTime || "10:00"),
                  ).map((time) => (
                    <option key={`end-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="cursor-pointer"
                onClick={() => setDayTimes(removeBatchAddDayTime(dayTimes, index))}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
