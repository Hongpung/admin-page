import { josa } from "es-hangul";
import type { TimeFormat } from "../constants/constants";
import type { WeekDay } from "../constants/constants";
import { RESERVATION_MESSAGE } from "../constants/reservation-message.constants";
import type { ReservationType, batchReservationOptions } from "../types";
import type { AddBatchReservationFormValues } from "../types/schemas";

export type BatchAddDayTimeRow = {
  day: WeekDay;
  startTime?: TimeFormat;
  endTime?: TimeFormat;
};

export type BatchAddOptionState = {
  title: string;
  reservationType: ReservationType;
  creatorName?: string;
  creatorId?: number;
};

export type BatchAddRunInput = {
  dayTimes: BatchAddDayTimeRow[];
  duration: { startDate?: Date; endDate?: Date };
  batchReservationOption: BatchAddOptionState;
  practiceTitle: string;
  /** 내부 예약 시 제목용 조사에 쓰는 표시 이름 */
  internalCreatorDisplayName: string;
};

type ValidBatchAddDayTimeRow = {
  day: WeekDay;
  startTime: TimeFormat;
  endTime: TimeFormat;
};

export type BatchAddPayload = {
  dayTimes: ValidBatchAddDayTimeRow[];
  duration: {
    startDate: string;
    endDate: string;
  };
  batchReservationOption:
    | batchReservationOptions<"EXTERNAL">
    | batchReservationOptions<"COMMON" | "REGULAR">;
};

export type BatchAddResult =
  | { ok: true; payload: BatchAddPayload }
  | { ok: false; message: string };

export function buildBatchAddPayload(input: BatchAddRunInput): BatchAddResult {
  if (input.dayTimes.length === 0) {
    return { ok: false, message: RESERVATION_MESSAGE.batchNeedSchedule };
  }

  const validDayTime = input.dayTimes.filter(
    (data) => data.startTime != null && data.endTime != null
  ) as ValidBatchAddDayTimeRow[];

  if (validDayTime.length === 0) {
    return { ok: false, message: RESERVATION_MESSAGE.batchNeedScheduleTime };
  }

  if (!input.duration.endDate || !input.duration.startDate) {
    return { ok: false, message: RESERVATION_MESSAGE.batchNeedDuration };
  }

  const opt = input.batchReservationOption;
  if (
    (opt.reservationType === "EXTERNAL" &&
      (!opt.creatorName || opt.creatorName.length === 0)) ||
    (opt.reservationType !== "EXTERNAL" && !opt.creatorId)
  ) {
    return { ok: false, message: RESERVATION_MESSAGE.batchNeedCreator };
  }

  const practiceTitle = input.practiceTitle.trim();
  const title =
    practiceTitle.length > 0
      ? practiceTitle
      : `${josa(
          opt.reservationType === "EXTERNAL"
            ? opt.creatorName!
            : input.internalCreatorDisplayName,
          "이/가"
        )} 만든 정기 연습`;

  const batchReservationOptionPayload =
    opt.reservationType === "EXTERNAL"
      ? ({
          title,
          reservationType: "EXTERNAL" as const,
          creatorName: (opt.creatorName ?? "").trim(),
        } satisfies batchReservationOptions<"EXTERNAL">)
      : ({
          title,
          reservationType: opt.reservationType as "COMMON" | "REGULAR",
          creatorId: opt.creatorId!,
        } satisfies batchReservationOptions<"COMMON" | "REGULAR">);

  return {
    ok: true,
    payload: {
      dayTimes: validDayTime,
      duration: {
        startDate: input.duration.startDate.toISOString().split("T")[0],
        endDate: input.duration.endDate.toISOString().split("T")[0],
      },
      batchReservationOption: batchReservationOptionPayload,
    },
  };
}

function parseYmdToLocalDate(value: string): Date | undefined {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function buildBatchAddPayloadFromForm(
  values: AddBatchReservationFormValues,
): BatchAddResult {
  return buildBatchAddPayload({
    dayTimes: values.dayTimes,
    duration: {
      startDate: parseYmdToLocalDate(values.startDate),
      endDate: parseYmdToLocalDate(values.endDate),
    },
    batchReservationOption: {
      title: values.title,
      reservationType: values.reservationType,
      creatorName:
        values.reservationType === "EXTERNAL" ? values.creatorName : undefined,
      creatorId:
        values.reservationType === "EXTERNAL" ? undefined : values.creatorId,
    },
    practiceTitle: values.title,
    internalCreatorDisplayName: values.creatorDisplayName,
  });
}
