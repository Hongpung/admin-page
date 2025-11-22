import { NOTICE_FORM_FIELD } from "../constants/notice-form.constants";

export type NoticeFormPayload = {
  title: string;
  content: string;
  noticeAll: boolean;
};

export function readNoticeFormPayload(
  form: HTMLFormElement
): NoticeFormPayload {
  const fd = new FormData(form);
  return {
    title: String(fd.get(NOTICE_FORM_FIELD.title) ?? "").trim(),
    content: String(fd.get(NOTICE_FORM_FIELD.content) ?? "").trim(),
    noticeAll: Boolean(fd.get(NOTICE_FORM_FIELD.noticeAll)),
  };
}
