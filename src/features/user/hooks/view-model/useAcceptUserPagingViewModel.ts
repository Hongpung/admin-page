import { useMemo } from "react";
import type { SignUpRequestUser } from "../../types";
import {
  calculateTotalPages,
  clampPage,
  getPagedSignupRows,
} from "../../lib";

type Args = {
  rows: SignUpRequestUser[] | undefined;
  page: number;
  take: number;
  selectedIds: number[];
};

export function useAcceptUserPagingViewModel({
  rows,
  page,
  take,
  selectedIds,
}: Args) {
  const allRows = useMemo(() => rows ?? [], [rows]);

  const totalPages = useMemo(() => {
    return calculateTotalPages(allRows.length, take);
  }, [allRows, take]);

  const safePage = clampPage(page, totalPages);
  const pagedRows = useMemo(() => {
    return getPagedSignupRows(allRows, safePage, take);
  }, [allRows, safePage, take]);

  const allChecked =
    pagedRows.length > 0 &&
    pagedRows.every((row) => selectedIds.includes(row.signupId));
  const someChecked = pagedRows.some((row) =>
    selectedIds.includes(row.signupId),
  );

  return {
    allRows,
    totalPages,
    safePage,
    pagedRows,
    allChecked,
    someChecked,
  };
}
