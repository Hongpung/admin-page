import { useQuery } from "@tanstack/react-query";
import { discardedReservationsQueryOptions } from "../../queries";

export function useDiscardedReservations(skip: number, take: number) {
  const discardedQuery = useQuery(discardedReservationsQueryOptions(skip, take));

  return {
    items: discardedQuery.data?.items ?? [],
    total: discardedQuery.data?.total ?? 0,
    loading: discardedQuery.isLoading || discardedQuery.isFetching,
    error: discardedQuery.isError
      ? "discarded 예약 목록을 불러오지 못했습니다."
      : null,
  };
}
