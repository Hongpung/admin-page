"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Notice } from "../../types";
import {
  buildDeleteConfirmMessage,
  NOTICE_LABEL,
  NOTICE_ACTION,
  NOTICE_MESSAGE,
} from "../../constants";
import { splitNoticeUpdatedAt } from "../../lib/notice-datetime";

type NoticeDetailPanelProps = {
  notice: Notice | null;
  onEdit: () => void;
  onDelete: (noticeId: number) => void;
};

export function NoticeDetailPanel({
  notice,
  onEdit,
  onDelete,
}: NoticeDetailPanelProps) {
  if (!notice) {
    return (
      <div className="flex min-h-[min(24rem,50vh)] w-full flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm font-medium text-neutral-500">
          {NOTICE_MESSAGE.emptyDetailFirstLine}
        </p>
        <p className="mt-1 text-sm text-neutral-400">
          {NOTICE_MESSAGE.emptyDetailSecondLine}
        </p>
      </div>
    );
  }

  const { datePart, timePart } = splitNoticeUpdatedAt(notice.updatedAt);

  return (
    <div className="grow flex w-full min-w-0 flex-col gap-5 h-full">
      <div className="flex shrink-0 flex-row items-start justify-end gap-4 border-b border-neutral-200 pb-4">
        <div className="flex shrink-0 flex-row items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-white px-2.5 py-1.5 text-sm font-medium text-sky-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-sky-400/40"
          >
            <Pencil className="size-3.5 shrink-0 opacity-80" aria-hidden />
            {NOTICE_ACTION.editButton}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(buildDeleteConfirmMessage(notice.title)))
                onDelete(notice.noticeId);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-sm font-medium text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-red-400/40"
          >
            <Trash2 className="size-3.5 shrink-0 opacity-80" aria-hidden />
            {NOTICE_ACTION.deleteButton}
          </button>
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        <h2 className="text-balance text-xl font-semibold leading-snug tracking-tight text-neutral-900">
          {notice.title}
        </h2>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-neutral-500">
          <time dateTime={notice.updatedAt}>{datePart}</time>
          <span className="text-neutral-300" aria-hidden>
            ·
          </span>
          <span className="tabular-nums">{timePart}</span>
          <span className="text-xs text-neutral-400">
            {NOTICE_LABEL.updatedAtLabel}
          </span>
        </div>
      </div>

      <div className="rounded-lg border flex-1 border-neutral-100 bg-neutral-50/90 px-4 py-4 text-sm leading-relaxed text-neutral-800 ring-1 ring-inset ring-neutral-200/40">
        <p className="whitespace-pre-wrap break-words">{notice.content}</p>
      </div>
    </div>
  );
}
