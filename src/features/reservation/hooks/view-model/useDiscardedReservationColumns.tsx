"use client";

import { useMemo } from "react";
import { RESERVATION_LABEL } from "../../constants/reservation-label.constants";
import {
  DISCARD_REASON_LABELS,
  formatDiscardedRowCreatedAt,
} from "../../lib/discarded";
import type { DiscardedReservationItem } from "../../types";

type Args = {
  onDetailOpen: (item: DiscardedReservationItem) => void;
};

export function useDiscardedReservationColumns({ onDetailOpen }: Args) {
  return useMemo(
    () => [
      {
        colKey: "reservationId",
        title: RESERVATION_LABEL.discardedReservationId,
        align: "center" as const,
        render: (_: unknown, item: DiscardedReservationItem) => (
          <button
            type="button"
            className="text-blue-700 underline underline-offset-2 hover:text-blue-900"
            onClick={() => onDetailOpen(item)}
          >
            {item.reservationId}
          </button>
        ),
      },
      {
        colKey: "discardedByType",
        title: RESERVATION_LABEL.discardedByType,
        dataIndex: "discardedByType" as const,
        align: "center" as const,
      },
      {
        colKey: "discardReason",
        title: RESERVATION_LABEL.discardedReason,
        align: "center" as const,
        render: (_: unknown, item: DiscardedReservationItem) =>
          DISCARD_REASON_LABELS[item.discardReason],
      },
      {
        colKey: "discardedByName",
        title: RESERVATION_LABEL.discardedCreatorClub,
        align: "center" as const,
        render: (_: unknown, item: DiscardedReservationItem) => {
          const creatorSnapshot = item.reservation.creatorSnapshot;
          if (creatorSnapshot?.name) {
            return (
              (creatorSnapshot.nickname
                ? `${creatorSnapshot.name} (${creatorSnapshot.nickname})`
                : creatorSnapshot.name) +
              (creatorSnapshot.club?.clubName
                ? ` / ${creatorSnapshot.club?.clubName}`
                : RESERVATION_LABEL.noAffiliation)
            );
          }

          return (
            item.reservation.externalCreatorName?.trim() ||
            RESERVATION_LABEL.noValue
          );
        },
      },
      {
        colKey: "createdAt",
        title: RESERVATION_LABEL.discardedCreatedAt,
        align: "center" as const,
        render: (_: unknown, item: DiscardedReservationItem) =>
          formatDiscardedRowCreatedAt(item.createdAt),
      },
    ],
    [onDetailOpen],
  );
}
