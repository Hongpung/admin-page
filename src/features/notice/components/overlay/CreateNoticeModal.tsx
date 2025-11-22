"use client";

import { NOTICE_FORM_ID, NOTICE_ACTION } from "../../constants";
import { useCreateNotice } from "../../hooks/action/useCreateNotice";
import { NoticeFormModalFrame } from "../ui/NoticeFormModalFrame";
import { NoticeModalForm } from "../ui/NoticeModalForm";

type CreateNoticeModalProps = {
  isOpen: boolean;
  onClose: (saved: boolean) => void;
};

export function CreateNoticeModal({ isOpen, onClose }: CreateNoticeModalProps) {
  const { handleSubmit } = useCreateNotice({ onClose });

  return (
    <NoticeFormModalFrame isOpen={isOpen} onDismiss={() => onClose(false)}>
      <NoticeModalForm
        heading={NOTICE_ACTION.createHeading}
        submitLabel={NOTICE_ACTION.createSubmitLabel}
        noticeAllCheckboxId={NOTICE_FORM_ID.createNoticeAll}
        onSubmit={handleSubmit}
      />
    </NoticeFormModalFrame>
  );
}
