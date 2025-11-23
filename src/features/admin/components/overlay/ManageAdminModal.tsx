"use client";

import Modal from "@admin/shared/components/Modal";
import { X } from "lucide-react";
import { ADMIN_MANAGE_TEXT } from "../../constants";
import { useManageAdminLevelState } from "../../hooks/state";
import { levelDisplay } from "../../service";
import type { AdminLevel, AdminSimple } from "../../types";

type Props = {
  admin: AdminSimple | null;
  onClose: () => void;
  onSave: (adminLevel: AdminLevel) => void;
  onRevoke: () => void;
};

export function ManageAdminModal({
  admin,
  onClose,
  onSave,
  onRevoke,
}: Props) {
  const { level, setLevel, levelWhenOpened } = useManageAdminLevelState(admin);

  return (
    <Modal isOpen={!!admin} onClose={onClose}>
      <div className="relative bg-white rounded-lg z-10 py-4 px-4 gap-6 flex flex-col">
        <div
          className="absolute top-3 cursor-pointer text-lg right-4 font-bold text-gray-400"
          onClick={onClose}
        >
          <X className="size-5" aria-hidden />
        </div>
        <div className="text-lg font-semibold">{ADMIN_MANAGE_TEXT.modalManageTitle}</div>
        <div className="flex flex-row justify-between items-center mx-4">
          <div className="text-gray-400">{ADMIN_MANAGE_TEXT.modalSelectedAdmin}</div>
          <div className="min-w-20 text-right">
            {admin?.name}
            {admin?.nickname ? ` (${admin.nickname})` : ""}
          </div>
        </div>
        <div className="flex flex-row justify-between items-center mx-4">
          <div className="text-gray-400">{ADMIN_MANAGE_TEXT.modalCurrentLevel}</div>
          <div className="text-right">{levelDisplay(levelWhenOpened)}</div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-row justify-between items-start mx-4">
            <div className="font-semibold">{ADMIN_MANAGE_TEXT.modalNextLevel}</div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="manage-admin-level"
                  checked={level === "SUPER"}
                  onChange={() => setLevel("SUPER")}
                  className="mr-1"
                />
                {ADMIN_MANAGE_TEXT.levelDisplay.super}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="manage-admin-level"
                  checked={level === "SUB"}
                  onChange={() => setLevel("SUB")}
                  className="mr-1"
                />
                {ADMIN_MANAGE_TEXT.levelDisplay.sub}
              </label>
            </div>
          </div>
          <div className="flex flex-row justify-end items-center h-fit gap-2">
            <div
              className="px-2 p-1 bg-red-500 text-white cursor-pointer rounded-md font-semibold"
              onClick={onRevoke}
            >
              {ADMIN_MANAGE_TEXT.modalRevokeAction}
            </div>
            <div
              className="px-2 p-1 bg-blue-500 text-white cursor-pointer rounded-md font-semibold"
              onClick={() => admin && onSave(level)}
            >
              {ADMIN_MANAGE_TEXT.modalChangeAction}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
