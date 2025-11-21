"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { DISPLAY_ROLES } from "../../constants/club-detail.constants";
import { useClubDetailRole } from "../../hooks/state/useClubDetailRole";
import type { ClubDetailFormValues } from "../../types";
import { ClubDetailRoleModal } from "../overlay/ClubDetailRoleModal";

export function ClubRoleAssignmentsSection() {
  const { control, getValues, setValue } =
    useFormContext<ClubDetailFormValues>();
  const clubId = useWatch({
    control,
    name: "clubId",
  });
  const roleAssignments = useWatch({
    control,
    name: "roleAssignments",
  });
  const roleAssigneeNames = useWatch({
    control,
    name: "roleAssigneeNames",
  });

  const {
    modalState,
    getCurrentAssigneeId,
    handleRoleAssign,
    handleRoleClear,
    handleRoleConfirm,
    handleRoleModalClose,
  } = useClubDetailRole({ getValues, setValue });

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">역할 지정</h3>
        <div className="space-y-2">
          {DISPLAY_ROLES.map((roleName) => {
            const assigneeId = roleAssignments[roleName];
            const assigneeName = roleAssigneeNames[roleName];

            return (
              <div
                key={roleName}
                className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {roleName}
                  </div>
                  {assigneeId !== null && assigneeId !== undefined ? (
                    <div className="text-sm text-gray-600">
                      {assigneeName ?? `사용자 #${assigneeId}`}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">지정되지 않음</div>
                  )}
                </div>

                {assigneeId !== null && assigneeId !== undefined ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRoleAssign(roleName)}
                      className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
                    >
                      변경
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleClear(roleName)}
                      className="rounded border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
                    >
                      해제
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRoleAssign(roleName)}
                    className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                  >
                    등록
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {modalState ? (
        <ClubDetailRoleModal
          visible={modalState.open}
          onClose={handleRoleModalClose}
          clubId={clubId}
          roleName={modalState.roleName}
          onConfirm={handleRoleConfirm}
          currentAssigneeId={getCurrentAssigneeId(modalState.roleName)}
        />
      ) : null}
    </>
  );
}
