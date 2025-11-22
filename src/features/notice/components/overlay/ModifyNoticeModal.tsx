"use client";

import type { Notice } from "../../types";
import {
  NOTICE_FORM_ID,
  NOTICE_ACTION,
} from "../../constants";
import { useModifyNotice } from "../../hooks/action/useModifyNotice";
import { NoticeFormModalFrame } from "../ui/NoticeFormModalFrame";
import { NoticeModalForm } from "../ui/NoticeModalForm";

type ModifyNoticeModalProps = {
  isOpen: boolean;
  notice: Notice;
  onClose: (saved: boolean) => void;
};

export function ModifyNoticeModal({
  isOpen,
  notice,
  onClose,
}: ModifyNoticeModalProps) {
  const { handleSubmit } = useModifyNotice({
    noticeId: notice.noticeId,
    onClose,
  });

  return (
    <NoticeFormModalFrame isOpen={isOpen} onDismiss={() => onClose(false)}>
      <NoticeModalForm
        formKey={notice.noticeId}
        heading={NOTICE_ACTION.modifyHeading}
        submitLabel={NOTICE_ACTION.modifySubmitLabel}
        noticeAllCheckboxId={NOTICE_FORM_ID.modifyNoticeAll}
        defaultTitle={notice.title}
        defaultContent={notice.content}
        onSubmit={handleSubmit}
      />
    </NoticeFormModalFrame>
  );
}
