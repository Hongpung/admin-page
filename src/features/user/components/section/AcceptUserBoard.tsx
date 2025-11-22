"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Pagination from "@admin/shared/components/Pagination";
import Table, {
  TABLE_SHELL_IN_SECTION_CLASS,
} from "@admin/shared/components/Table";
import TableSection from "@admin/shared/components/TableSection";
import VisibleLengthSelect from "@admin/shared/components/VisibleLengthSelect";
import { ErrorNotice } from "@admin/shared/components/ErrorNotice";
import type { SignUpRequestUser } from "../../types";
import { createAcceptUserColumns } from "../../lib";
import { acceptUserListQueryOptions } from "../../queries";
import { toUserActionErrorMessage } from "../../service";
import { useAcceptUserAcceptAction } from "../../hooks/action";
import {
  useAcceptUserPagingState,
  useAcceptUserSelection,
} from "../../hooks/state";
import { useAcceptUserPagingViewModel } from "../../hooks/view-model";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function AcceptUserBoard({ isSub }: { isSub: boolean }) {
  const queryOptions = acceptUserListQueryOptions(isSub);
  const signupListQuery = useQuery(queryOptions);
  const { page, take, setPage, setTake } = useAcceptUserPagingState();
  const {
    selectedIds,
    handleSelectAll,
    handleSelectOne,
    clearSelected,
    removeSelected,
  } = useAcceptUserSelection();
  const {
    totalPages,
    safePage,
    allRows,
    pagedRows,
    allChecked,
    someChecked,
  } = useAcceptUserPagingViewModel({
    rows: signupListQuery.data,
    page,
    take,
    selectedIds,
  });
  const {
    acceptSignupIds,
    isAccepting,
    errorMessage: acceptErrorMessage,
  } = useAcceptUserAcceptAction({ queryKey: queryOptions.queryKey });

  const handleSelectAllInPage = useCallback(
    (checked: boolean) => handleSelectAll(checked, pagedRows),
    [handleSelectAll, pagedRows],
  );

  const handleAcceptOne = useCallback(
    async (user: SignUpRequestUser) => {
      const confirmed = window.confirm(
        `${user.name} 사용자의 가입 요청을 수락하시겠습니까?`,
      );
      if (!confirmed) return;

      try {
        await acceptSignupIds([user.signupId]);
      } catch {
        return;
      }
      removeSelected(user.signupId);
    },
    [acceptSignupIds, removeSelected],
  );

  const handleAcceptSelected = useCallback(async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(
      `선택한 ${selectedIds.length}명의 가입 요청을 모두 수락하시겠습니까?`,
    );
    if (!confirmed) return;

    try {
      await acceptSignupIds(selectedIds);
    } catch {
      return;
    }
    clearSelected();
  }, [acceptSignupIds, clearSelected, selectedIds]);

  const loading = signupListQuery.isLoading;
  const errorMessage = signupListQuery.error
    ? toUserActionErrorMessage(signupListQuery.error)
    : acceptErrorMessage;

  const columns = useMemo(
    () =>
      createAcceptUserColumns({
        allChecked,
        someChecked,
        selectedIds,
        onSelectAll: handleSelectAllInPage,
        onSelectOne: handleSelectOne,
        onAcceptOne: handleAcceptOne,
      }),
    [
      allChecked,
      someChecked,
      selectedIds,
      handleSelectAllInPage,
      handleSelectOne,
      handleAcceptOne,
    ],
  );

  return (
    <>
      {errorMessage ? (
        <div className="mb-3">
          <ErrorNotice detail={errorMessage} />
        </div>
      ) : null}
      <div className="text-lg font-medium ml-2 mt-2">
        가입요청 관리{!loading ? ` (${allRows.length})` : ""}
      </div>

      <div className="flex flex-row justify-between items-center gap-4 ml-2 mt-2 flex-wrap">
        <div className="flex flex-row flex-wrap gap-4 min-h-10 items-center flex-1 min-w-0">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
            disabled={selectedIds.length === 0 || isAccepting}
            onClick={() => {
              void handleAcceptSelected();
            }}
          >
            선택한 유저 수락
          </button>
        </div>
        <VisibleLengthSelect
          value={take}
          options={PAGE_SIZE_OPTIONS}
          onChange={(next) => {
            setPage(0);
            setTake(next);
          }}
          className="flex flex-row gap-3 h-10 items-center shrink-0"
        />
      </div>

      <TableSection
        footer={
          !loading ? (
            <Pagination
              className="!mt-0"
              page={safePage}
              maxPage={totalPages}
              onPageChange={setPage}
              showWhenSinglePage
            />
          ) : null
        }
      >
        <Table
          dataSource={pagedRows}
          columns={columns}
          rowKey="signupId"
          loading={loading}
          emptyText="가입을 요청한 유저가 없습니다..."
          shellClassName={TABLE_SHELL_IN_SECTION_CLASS}
          rowClassName="bg-slate-100"
          onRowClick={(user) => {
            const checked = selectedIds.includes(user.signupId);
            handleSelectOne(user.signupId, !checked);
          }}
        />
      </TableSection>
    </>
  );
}
