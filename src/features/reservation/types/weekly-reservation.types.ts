import type { ColorFormat } from "../constants/constants";
import type { DateReservation } from "./reservation.types";

export type WeeklyReservationCell = {
  reservation: DateReservation;
  isStart: boolean;
  isEnd: boolean;
  color: ColorFormat;
};

export type WeeklyReservationsMap = {
  [day: string]: {
    [time: string]: WeeklyReservationCell;
  };
};
