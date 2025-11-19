import type { ReservationType } from "./reservation.types";

export type BatchReservationOptions<T extends ReservationType> = {
  title: string;
  reservationType: T;
} & (T extends "EXTERNAL"
  ? { creatorName: string; creatorId?: undefined }
  : { creatorName?: undefined; creatorId: number });

export type batchReservationOptions<T extends ReservationType> =
  BatchReservationOptions<T>;
