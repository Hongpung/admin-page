"use client";

import Modal from "@admin/shared/components/Modal";
import { useState } from "react";
import { useClubRoleModalColumns } from "../../hooks/state/useClubRoleModalColumns";
import type { SearchMember } from "../../types";
import { useClubMemberSearch } from "../../hooks/state/useClubMemberSearch";
import { ClubRoleModalSearchBar } from "../ui/ClubRoleModalSearchBar";
import { ClubRoleModalConfirmButton } from "../ui/ClubRoleModalConfirmButton";
import { ClubRoleModalHeader } from "../ui/ClubRoleModalHeader";
import { ClubRoleMemberTable } from "../ui/ClubRoleMemberTable";

export function ClubRoleAssignmentModal({
  visible,
  onClose,
  clubId,
  roleName,
  onConfirm,
  currentAssigneeId,
}: {
  visible: boolean;
  onClose: () => void;
  clubId: number;
  roleName: string;
  onConfirm: (member: SearchMember) => void;
  currentAssigneeId?: number;
}) {
  const [selectedMember, selectMember] = useState<SearchMember | undefined>(
    undefined,
  );
  const {
    searchingMembers,
    isLoading,
    setLoading,
    setKeyword,
    debouncedHandleChange,
  } = useClubMemberSearch(clubId);
  const columns = useClubRoleModalColumns(currentAssigneeId);

  const handleReset = () => {
    setKeyword("");
    debouncedHandleChange.cancel();
    selectMember(undefined);
  };

  const handleConfirm = () => {
    if (selectedMember) {
      onConfirm(selectedMember);
      handleReset();
      onClose();
    }
  };

  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ClubRoleModalHeader roleName={roleName} onClose={onClose} />
      <ClubRoleModalSearchBar
        onReset={handleReset}
        onKeywordChange={(value) => {
          setLoading(true);
          debouncedHandleChange(value);
        }}
      />

      <ClubRoleMemberTable
        searchingMembers={searchingMembers}
        isLoading={isLoading}
        columns={columns}
        selectedMemberId={selectedMember?.memberId}
        onSelectMember={selectMember}
      />

      <ClubRoleModalConfirmButton
        selectedMember={selectedMember}
        onConfirm={handleConfirm}
      />
    </Modal>
  );
}
