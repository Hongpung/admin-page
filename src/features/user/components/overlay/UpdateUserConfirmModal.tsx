"use client";

import Modal from "@admin/shared/components/Modal";

type Props = {
  isOpen: boolean;
  userName?: string;
  nickname?: string | null;
  password: string;
  onClose: () => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function UpdateUserConfirmModal({
  isOpen,
  userName,
  nickname,
  password,
  onClose,
  onPasswordChange,
  onSubmit,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-5 rounded-lg bg-white p-6">
        <div className="flex flex-col gap-2">
          <div className="text-lg font-semibold text-gray-900">회원 정보 수정</div>
          <div className="text-sm leading-6 text-gray-500">
            {userName}
            {`${nickname ? ` (${nickname})` : ""}`} 회원의 소속 동아리 또는 로그인
            이메일 변경에는 관리자 비밀번호가 필요합니다.
          </div>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          placeholder="관리자 비밀번호"
          autoComplete="current-password"
          className="w-full rounded-md border px-3 py-2"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-2 font-medium text-gray-700"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-500 px-3 py-2 font-medium text-white"
            onClick={onSubmit}
          >
            저장
          </button>
        </div>
      </div>
    </Modal>
  );
}
