import { useState } from "react";

export function useAcceptUserPagingState(initialTake = 20) {
  const [page, setPage] = useState(0);
  const [take, setTake] = useState(initialTake);

  return {
    page,
    take,
    setPage,
    setTake,
  };
}
