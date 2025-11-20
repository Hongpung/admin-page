"use client";

import { useCallback, useState } from "react";
import type { DiscardedReservationItem } from "../../types";

export function useDiscardedReservationListState() {
  const [page, setPage] = useState(0);
  const [take, setTake] = useState(20);
  const [selectedDetailItem, setSelectedDetailItem] =
    useState<DiscardedReservationItem | null>(null);

  const skip = page * take;
  const getTotalPages = useCallback(
    (total: number) => (total > 0 ? Math.ceil(total / take) : 1),
    [take],
  );

  const changeTake = (nextTake: number) => {
    setPage(0);
    setTake(nextTake);
  };

  return {
    page,
    setPage,
    take,
    changeTake,
    skip,
    getTotalPages,
    selectedDetailItem,
    setSelectedDetailItem,
  };
}
