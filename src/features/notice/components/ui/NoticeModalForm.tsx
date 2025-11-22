"use client";

import type { FormEventHandler } from "react";
import { NOTICE_FORM_FIELD, NOTICE_LABEL } from "../../constants";

export type NoticeModalFormProps = {
  heading: string;
  submitLabel: string;
  noticeAllCheckboxId: string;
  defaultTitle?: string;
  defaultContent?: string;
  defaultNoticeAll?: boolean;
  formKey?: string | number;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function NoticeModalForm({
  heading,
  submitLabel,
  noticeAllCheckboxId,
  defaultTitle = "",
  defaultContent = "",
  defaultNoticeAll = false,
  formKey,
  onSubmit,
}: NoticeModalFormProps) {
  return (
    <form
      key={formKey}
      className="mt-2 flex flex-col gap-4"
      onSubmit={onSubmit}
    >
      <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
        {heading}
      </h2>

      <div className="space-y-1.5">
        <label htmlFor={`${noticeAllCheckboxId}-title`} className="sr-only">
          {NOTICE_LABEL.titleLabel}
        </label>
        <input
          id={`${noticeAllCheckboxId}-title`}
          required
          name={NOTICE_FORM_FIELD.title}
          type="text"
          placeholder={NOTICE_LABEL.titlePlaceholder}
          defaultValue={defaultTitle}
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${noticeAllCheckboxId}-content`} className="sr-only">
          {NOTICE_LABEL.contentLabel}
        </label>
        <textarea
          id={`${noticeAllCheckboxId}-content`}
          required
          name={NOTICE_FORM_FIELD.content}
          placeholder={NOTICE_LABEL.contentPlaceholder}
          defaultValue={defaultContent}
          rows={14}
          className="min-h-[min(24rem,55vh)] w-full resize-y rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25"
        />
      </div>

      <div className="mt-1 flex flex-row flex-wrap items-center justify-end gap-4 border-t border-neutral-100 pt-4">
        <label
          htmlFor={noticeAllCheckboxId}
          className="flex cursor-pointer flex-row items-center gap-2 text-sm"
        >
          <input
            id={noticeAllCheckboxId}
            type="checkbox"
            name={NOTICE_FORM_FIELD.noticeAll}
            defaultChecked={defaultNoticeAll}
            className="peer size-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-400/40"
          />
          <span className="text-neutral-500 peer-checked:text-neutral-900">
            {NOTICE_LABEL.noticeAllLabel}
          </span>
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-sky-500/50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
