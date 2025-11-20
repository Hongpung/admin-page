"use client";

import Modal from "@admin/shared/components/Modal";
import Pagination from "@admin/shared/components/Pagination";
import Table from "@admin/shared/components/Table";
import { X } from "lucide-react";
import { useCreatorSelectState } from "../../hooks/state";
import {
  useCreatorSelectColumns,
  useCreatorSelectMembers,
} from "../../hooks/view-model";
import { CreatorSearchFilters } from "../ui/CreatorSearchFilters";

export function CreatorSelectModal({
  visible,
  onClose,
  creatorId,
  setCreator,
}: {
  visible: boolean;
  onClose: () => void;
  creatorId?: number;
  setCreator: (user: {
    userId: number;
    userName: string;
    userNickname?: string;
  }) => void;
}) {
  const { selectedMember, selectMember } = useCreatorSelectState();
  
  const {
    filters: {
      inputKeyword,
      clubId,
      role,
      setRawPage,
      onKeywordChange,
      updateClubId,
      updateRole,
      resetFilters,
    },
    searchingMembers,
    totalMembers,
    page,
    isLoading,
    maxPage,
  } = useCreatorSelectMembers({ visible });

  const columns = useCreatorSelectColumns({ creatorId });

  return (
    <Modal isOpen={visible} onClose={onClose}>
      <div className="absolute right-8 top-4 cursor-pointer" onClick={onClose}>
        <X className="size-5" aria-hidden />
      </div>
      <div className="font-bold text-lg">예약자 선택</div>
      <CreatorSearchFilters
        keyword={inputKeyword}
        clubId={clubId}
        role={role}
        onReset={resetFilters}
        onKeywordChange={onKeywordChange}
        onClubChange={updateClubId}
        onRoleChange={updateRole}
      />

      <Table
        dataSource={searchingMembers ?? []}
        columns={columns}
        rowKey="memberId"
        loading={isLoading || searchingMembers === null}
        loadingContent={<div className="py-8 text-gray-500">로딩중...</div>}
        emptyText="검색 결과 없습니다."
        emptyClassName="!text-base !font-normal py-8"
        messageAreaMinHeightClass="min-h-[12.5rem]"
        shellClassName="mt-4 h-[16.5rem] max-h-[16.5rem] w-full shrink-0 overflow-y-auto rounded-md border"
        tableClassName="w-full text-sm border-separate border-spacing-0"
        stickyHeader
        onRowClick={(member) => selectMember(member)}
        rowClassName={(record) =>
          [
            selectedMember?.memberId === record.memberId
              ? "bg-slate-200"
              : "hover:bg-slate-100",
            "cursor-pointer",
          ].join(" ")
        }
      />

      {!isLoading && searchingMembers !== null ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="text-xs text-gray-500">
            총 {totalMembers}명 · {page + 1}/{maxPage} 페이지
          </div>
          <Pagination
            className="!mt-0 !justify-end"
            page={page}
            maxPage={maxPage}
            onPageChange={setRawPage}
            showWhenSinglePage
          />
        </div>
      ) : null}

      <div className="w-full flex flex-col mt-4">
        <div
          className={`px-4 py-2 rounded-md self-center ${
            selectedMember
              ? "bg-blue-500 text-white cursor-pointer"
              : "bg-slate-100"
          }`}
          onClick={() => {
            if (selectedMember) {
              setCreator({
                userId: selectedMember.memberId,
                userName: selectedMember.name,
                userNickname: selectedMember.nickname,
              });
              onClose();
            }
          }}
        >
          {selectedMember ? `${selectedMember.name} 선택 완료` : "선택"}
        </div>
      </div>
    </Modal>
  );
}
