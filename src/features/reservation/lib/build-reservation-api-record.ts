import type { TimeFormat } from "../constants/constants";
import type { ReservationType } from "../types";

export type ReservationFormStateSlice = {
  date?: string;
  startTime?: TimeFormat;
  endTime?: TimeFormat;
  reservationType: ReservationType;
  participationAvailable: boolean;
  creatorId?: number;
};

/**
 * 생성/수정 폼에서 API로 보내는 레코드 조립 (practice-name, external-username은 FormData)
 */
export function buildReservationApiRecord(
  formData: FormData,
  state: ReservationFormStateSlice
): Record<string, string | boolean | number | undefined> {
  const title = (formData.get("practice-name") as string)?.trim() ?? "";
  const record: Record<string, string | boolean | number | undefined> = {
    title,
    date: state.date,
    startTime: state.startTime,
    endTime: state.endTime,
    reservationType: state.reservationType,
    participationAvailable: state.participationAvailable,
  };

  if (state.reservationType === "EXTERNAL") {
    record.externalCreatorName =
      (formData.get("external-username") as string)?.trim() ?? "";
  } else if (state.creatorId) {
    record.creatorId = state.creatorId;
  }

  return record;
}
