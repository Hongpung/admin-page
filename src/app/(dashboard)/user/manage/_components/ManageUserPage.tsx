"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import ManageUserSearchBar from "@admin/shared/components/ManageUserSearchBar";
import Pagination from "@admin/shared/components/Pagination";
import Table, {
  TABLE_SHELL_IN_SECTION_CLASS,
} from "@admin/shared/components/Table";
import TableSection from "@admin/shared/components/TableSection";
import VisibleLengthSelect from "@admin/shared/components/VisibleLengthSelect";
import type { UpdateMemberByAdminReqDto, User } from "@admin/features/user";
import { MANAGE_USER_PAGE_SIZE_OPTIONS } from "@admin/features/user";
import { ManageUserModal } from "@admin/features/user/components";
import { createManageUserColumns } from "@admin/features/user/lib";
import {
  useManageUserDeleteAction,
  useManageUserSearchNavigation,
  useManageUserUpdateAction,
} from "@admin/features/user/hooks/action";
import { useManageUserSearchForm } from "@admin/features/user/hooks/form";
import { useManageUserList } from "@admin/features/user/hooks/view-model";

export function ManageUserPage() {
  const [modifiedUser, setModifiedUser] = useState<User | null>(null);
  const {
    page,
    pageSize,
    keyword,
    clubId,
    role,
    pushSearchParams,
    resetSearchParams,
  } = useManageUserSearchNavigation();
  const {
    keywordInput,
    clubIdInput,
    roleInput,
    setKeywordInput,
    setClubIdInput,
    setRoleInput,
    resetForm,
  } = useManageUserSearchForm({ keyword, clubId, role });
  const { maxPage, totalCount, userData, sortedMembers } =
    useManageUserList({ page, pageSize, keyword, clubId, role });
  const { tryDeleteManagedUser } = useManageUserDeleteAction();
  const { tryUpdateManagedUser, isUpdating } = useManageUserUpdateAction();

  const columns = useMemo(
    () => createManageUserColumns({ onSelectUser: setModifiedUser }),
    [],
  );

  const handleReset = () => {
    resetForm();
    resetSearchParams();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pushSearchParams({
      page: 0,
      keyword: keywordInput,
      clubId: clubIdInput,
      role: roleInput,
    });
  };

  const handleDeleteUser = (password: string) => {
    if (!modifiedUser) return;
    void tryDeleteManagedUser(modifiedUser, password);
  };

  const handleUpdateUser = async ({
    memberId,
    payload,
  }: {
    memberId: number;
    payload: UpdateMemberByAdminReqDto;
  }) => {
    const ok = await tryUpdateManagedUser({ memberId, payload });
    if (ok) {
      setModifiedUser(null);
    }
    return ok;
  };

  return (
    <>
      <div className="text-lg font-medium ml-2 mt-2">
        유저 관리 ({totalCount})
      </div>

      <div className="flex flex-row justify-between items-center gap-4 ml-2 mt-2 flex-wrap">
        <ManageUserSearchBar
          keywordInput={keywordInput}
          onKeywordChange={setKeywordInput}
          clubIdInput={clubIdInput}
          onClubIdChange={setClubIdInput}
          roleInput={roleInput}
          onRoleChange={setRoleInput}
          onSubmit={handleSubmit}
          onReset={handleReset}
          className="flex flex-row flex-wrap gap-4 min-h-10 items-center"
        />
        <VisibleLengthSelect
          value={pageSize}
          options={MANAGE_USER_PAGE_SIZE_OPTIONS}
          onChange={(next) => pushSearchParams({ page: 0, pageSize: next })}
          className="flex flex-row gap-3 h-10 items-center shrink-0"
        />
      </div>

      <TableSection
        footer={
          userData !== null ? (
            <Pagination
              className="!mt-0"
              page={page}
              maxPage={maxPage}
              onPageChange={(nextPage) => pushSearchParams({ page: nextPage })}
              showWhenSinglePage
            />
          ) : null
        }
      >
        <Table
          dataSource={sortedMembers}
          columns={columns}
          rowKey="memberId"
          loading={userData === null}
          emptyText="가입한 유저가 없습니다..."
          shellClassName={TABLE_SHELL_IN_SECTION_CLASS}
          rowClassName={(_, index) => (index % 2 === 1 ? "bg-blue-100" : "")}
        />
      </TableSection>

      <ManageUserModal
        user={modifiedUser}
        onClose={() => setModifiedUser(null)}
        onDelete={handleDeleteUser}
        onUpdate={handleUpdateUser}
        isUpdating={isUpdating}
      />
    </>
  );
}
