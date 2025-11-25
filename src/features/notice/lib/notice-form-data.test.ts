import { describe, expect, it } from "vitest";
import { NOTICE_FORM_FIELD } from "../constants";
import { readNoticeFormPayload } from "./notice-form-data";

function buildNoticeForm({ noticeAll }: { noticeAll?: boolean } = {}) {
  const form = document.createElement("form");

  const title = document.createElement("input");
  title.name = NOTICE_FORM_FIELD.title;
  title.value = "  제목  ";
  form.append(title);

  const content = document.createElement("textarea");
  content.name = NOTICE_FORM_FIELD.content;
  content.value = "  내용  ";
  form.append(content);

  if (noticeAll) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = NOTICE_FORM_FIELD.noticeAll;
    checkbox.checked = true;
    form.append(checkbox);
  }

  return form;
}

describe("readNoticeFormPayload", () => {
  it("제목과 내용을 trim하고 체크박스 값을 true로 읽는다", () => {
    expect(readNoticeFormPayload(buildNoticeForm({ noticeAll: true }))).toEqual({
      title: "제목",
      content: "내용",
      noticeAll: true,
    });
  });

  it("체크박스 값이 없으면 false로 읽는다", () => {
    expect(readNoticeFormPayload(buildNoticeForm())).toEqual({
      title: "제목",
      content: "내용",
      noticeAll: false,
    });
  });
});
