"use client";

import { useEffect, useState } from "react";
import Modal from "@admin/shared/components/Modal";
import { X } from "lucide-react";
import { UserRoleSummaryRow } from "../ui";
import { MANAGE_USER_CLUB_OPTIONS } from "../../constants";
import { useManageUserEditForm } from "../../hooks/form";
import { useManageUserRoleSnapshot } from "../../hooks/state";
import { createManageUserAdminUpdateDefaultValues } from "../../lib";
import { hasAdminPassword } from "../../service";
import type { UpdateMemberByAdminReqDto, User } from "../../types";
import { DeleteUserConfirmModal } from "./DeleteUserConfirmModal";
import { UpdateUserConfirmModal } from "./UpdateUserConfirmModal";

type Props = {
  user: User | null;
  onClose: () => void;
  onDelete: (password: string) => void;
  onUpdate: (args: {
    memberId: number;
    payload: UpdateMemberByAdminReqDto;
  }) => Promise<boolean>;
  isUpdating?: boolean;
};

const rowClass = "flex flex-row justify-between items-center mx-4 h-8";
const rowLabelClass = "text-gray-400";
const rowFieldWrapClass = "min-w-20 text-right";
const fieldInputClass =
  "w-64 rounded-md border border-gray-300 bg-white px-2 py-1 text-right outline-none focus:border-blue-400";
const errorClass = "mt-1 text-xs text-red-500 text-right";

export function ManageUserModal({
  user,
  onClose,
  onDelete,
  onUpdate,
  isUpdating = false,
}: Props) {
  const { rolesWhenOpened } = useManageUserRoleSnapshot({ user });
  const { form, buildRequest } = useManageUserEditForm({
    user,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [updatePassword, setUpdatePassword] = useState("");
  const [isUpdateConfirmModalOpen, setIsUpdateConfirmModalOpen] =
    useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    memberId: number;
    payload: UpdateMemberByAdminReqDto;
  } | null>(null);

  useEffect(() => {
    setIsEditMode(false);
    setDeletePassword("");
    setIsDeleteModalOpen(false);
    setUpdatePassword("");
    setIsUpdateConfirmModalOpen(false);
    setPendingUpdate(null);
  }, [user?.memberId]);

  const selectedUserName = user
    ? `${user.name}${user.nickname ? ` (${user.nickname})` : ""}`
    : "";
  const openedRolesLabel =
    rolesWhenOpened.length === 0 ? "동아리원" : rolesWhenOpened.join(", ");

  const handleToggleEditMode = () => {
    if (!user) return;

    if (isEditMode) {
      reset(createManageUserAdminUpdateDefaultValues(user));
      setIsEditMode(false);
      return;
    }

    setIsEditMode(true);
  };

  const handleDeleteClick = () => {
    if (!user) return;
    setDeletePassword("");
    setIsDeleteModalOpen(true);
  };

  const handleDeleteModalClose = () => {
    setDeletePassword("");
    setIsDeleteModalOpen(false);
  };

  const handleUpdateSubmit = handleSubmit(async () => {
    if (!user) return;

    const { payload, hasChanges, requiresAdminPassword } = buildRequest();
    if (!hasChanges) {
      alert("변경된 내용이 없습니다.");
      return;
    }

    if (requiresAdminPassword) {
      setPendingUpdate({
        memberId: user.memberId,
        payload,
      });
      setUpdatePassword("");
      setIsUpdateConfirmModalOpen(true);
      return;
    }

    const updated = await onUpdate({
      memberId: user.memberId,
      payload,
    });

    if (updated) {
      setIsEditMode(false);
    }
  });

  const handleUpdateConfirmModalClose = () => {
    setUpdatePassword("");
    setPendingUpdate(null);
    setIsUpdateConfirmModalOpen(false);
  };

  const handleConfirmedUpdateSubmit = async () => {
    if (!pendingUpdate) return;
    if (!hasAdminPassword(updatePassword)) {
      alert("관리자 비밀번호를 입력해주세요.");
      return;
    }

    const updated = await onUpdate({
      memberId: pendingUpdate.memberId,
      payload: {
        ...pendingUpdate.payload,
        adminPassword: updatePassword.trim(),
      },
    });

    if (!updated) return;

    setUpdatePassword("");
    setPendingUpdate(null);
    setIsUpdateConfirmModalOpen(false);
    setIsEditMode(false);
  };

  const handleDeleteSubmit = () => {
    if (!hasAdminPassword(deletePassword)) {
      alert("관리자 비밀번호를 입력해주세요.");
      return;
    }

    onDelete(deletePassword);
    setDeletePassword("");
    setIsDeleteModalOpen(false);
  };

  return (
    <Modal isOpen={!!user} onClose={onClose}>
      <div className="relative bg-white rounded-lg z-10 py-4 px-4 gap-6 flex flex-col">
        <div
          className="absolute top-3 cursor-pointer text-lg right-4 font-bold text-gray-400"
          onClick={onClose}
        >
          <X className="size-5" aria-hidden />
        </div>
        <div className="text-lg font-semibold">유저 관리</div>
        {!isEditMode ? (
          <>
            <UserRoleSummaryRow label="이름 (패명)" value={selectedUserName} />
            <UserRoleSummaryRow label="동아리" value={user?.club ?? ""} />
            <UserRoleSummaryRow
              label="학번"
              value={user?.enrollmentNumber.toString().padStart(2, "0") ?? ""}
            />
            <UserRoleSummaryRow
              label="로그인 이메일"
              value={user?.email ?? ""}
            />
            <UserRoleSummaryRow label="역할" value={openedRolesLabel} />
          </>
        ) : null}
        {isEditMode ? (
          <form
            className="mt-1 flex flex-col gap-6"
            onSubmit={handleUpdateSubmit}
          >
            <div className={rowClass}>
              <label className={rowLabelClass} htmlFor="manage-user-name">
                이름
              </label>
              <div className={rowFieldWrapClass}>
                <input
                  id="manage-user-name"
                  type="text"
                  className={fieldInputClass}
                  autoComplete="off"
                  {...register("name")}
                />
                {errors.name?.message ? (
                  <p className={errorClass}>{errors.name.message}</p>
                ) : null}
              </div>
            </div>

            <div className={rowClass}>
              <label className={rowLabelClass} htmlFor="manage-user-nickname">
                패명
              </label>
              <div className={rowFieldWrapClass}>
                <input
                  id="manage-user-nickname"
                  type="text"
                  className={fieldInputClass}
                  autoComplete="off"
                  {...register("nickname")}
                />
                {errors.nickname?.message ? (
                  <p className={errorClass}>{errors.nickname.message}</p>
                ) : null}
              </div>
            </div>
            <UserRoleSummaryRow
              label="학번"
              value={user?.enrollmentNumber.toString().padStart(2, "0") ?? ""}
            />
            <div className={rowClass}>
              <label className={rowLabelClass} htmlFor="manage-user-email">
                로그인 이메일
              </label>
              <div className={rowFieldWrapClass}>
                <input
                  id="manage-user-email"
                  type="email"
                  className={fieldInputClass}
                  autoComplete="off"
                  {...register("email")}
                />
                {errors.email?.message ? (
                  <p className={errorClass}>{errors.email.message}</p>
                ) : null}
              </div>
            </div>

            <div className={rowClass}>
              <label className={rowLabelClass} htmlFor="manage-user-clubId">
                소속 동아리
              </label>
              <div className={rowFieldWrapClass}>
                <select
                  id="manage-user-clubId"
                  className={fieldInputClass}
                  {...register("clubId")}
                >
                  {MANAGE_USER_CLUB_OPTIONS.map((clubOption) => (
                    <option key={clubOption.value} value={clubOption.value}>
                      {clubOption.label}
                    </option>
                  ))}
                </select>
                {errors.clubId?.message ? (
                  <p className={errorClass}>{errors.clubId.message}</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-row items-center justify-between border-t border-neutral-100 pt-4">
              <button
                type="button"
                className="rounded-md bg-gray-200 px-3 py-2 font-semibold text-gray-800"
                onClick={handleToggleEditMode}
              >
                수정 모드 해제
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md bg-red-500 px-3 py-2 font-semibold text-white"
                  onClick={handleDeleteClick}
                >
                  회원 삭제
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-md bg-blue-500 px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isUpdating ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-row items-center justify-between border-t border-neutral-100 pt-4">
            <button
              type="button"
              className="rounded-md bg-blue-100 px-3 py-2 font-semibold text-blue-800"
              onClick={handleToggleEditMode}
            >
              수정 모드 활성화
            </button>
            <button
              type="button"
              className="rounded-md bg-red-500 px-3 py-2 font-semibold text-white"
              onClick={handleDeleteClick}
            >
              회원 삭제
            </button>
          </div>
        )}
      </div>
      <DeleteUserConfirmModal
        isOpen={isDeleteModalOpen}
        userName={user?.name}
        nickname={user?.nickname}
        password={deletePassword}
        onClose={handleDeleteModalClose}
        onPasswordChange={setDeletePassword}
        onSubmit={handleDeleteSubmit}
      />
      <UpdateUserConfirmModal
        isOpen={isUpdateConfirmModalOpen}
        userName={user?.name}
        nickname={user?.nickname}
        password={updatePassword}
        onClose={handleUpdateConfirmModalClose}
        onPasswordChange={setUpdatePassword}
        onSubmit={() => {
          void handleConfirmedUpdateSubmit();
        }}
      />
    </Modal>
  );
}
