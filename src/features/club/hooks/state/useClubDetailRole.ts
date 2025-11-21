import { useState } from "react";
import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import type { ClubDetailFormValues, KoRole } from "../../types";

export function useClubDetailRole({
  getValues,
  setValue,
}: {
  getValues: UseFormGetValues<ClubDetailFormValues>;
  setValue: UseFormSetValue<ClubDetailFormValues>;
}) {
  const [modalState, setModalState] = useState<{
    open: boolean;
    roleName: KoRole;
  } | null>(null);

  const handleRoleModalClose = () => {
    setModalState(null);
  };

  const handleRoleAssign = (roleName: KoRole) => {
    setModalState({ open: true, roleName });
  };

  const handleRoleConfirm = (member: {
    memberId: number;
    name: string;
    nickname?: string;
  }) => {
    if (!modalState) return;

    const currentRoleAssignments = getValues("roleAssignments");

    setValue(
      "roleAssignments",
      {
        ...currentRoleAssignments,
        [modalState.roleName]: member.memberId,
      },
      { shouldDirty: true },
    );
    setValue(
      "roleAssigneeNames",
      {
        ...getValues("roleAssigneeNames"),
        [modalState.roleName]: member.name + (member.nickname ? ` (${member.nickname})` : ""),
      },
      { shouldDirty: true },
    );
  };

  const handleRoleClear = (roleName: KoRole) => {
    const currentRoleAssignments = getValues("roleAssignments");

    setValue(
      "roleAssignments",
      {
        ...currentRoleAssignments,
        [roleName]: null,
      },
      { shouldDirty: true },
    );
    setValue(
      "roleAssigneeNames",
      {
        ...getValues("roleAssigneeNames"),
        [roleName]: null,
      },
      { shouldDirty: true },
    );
  };

  const getCurrentAssigneeId = (roleName: KoRole) => {
    return getValues("roleAssignments")[roleName] ?? undefined;
  };

  return {
    modalState,
    handleRoleModalClose,
    handleRoleAssign,
    handleRoleConfirm,
    handleRoleClear,
    getCurrentAssigneeId,
  };
}
