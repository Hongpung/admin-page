"use client";

import { useEffect, useMemo, useRef } from "react";
import { debounce } from "lodash";
import { RefreshCcw } from "lucide-react";
import type { Notice } from "../../types";
import { NOTICE_LABEL, NOTICE_MESSAGE } from "../../constants";
import { splitNoticeUpdatedAt } from "../../lib/notice-datetime";

type NoticeListPanelProps = {
  notices: Notice[];
  selectedNoticeId: number | null;
  onSelectNotice: (noticeId: number) => void;
  onRefresh: () => Promise<void>;
};

export function NoticeListPanel({
  notices,
  selectedNoticeId,
  onSelectNotice,
  onRefresh,
}: NoticeListPanelProps) {
  const iconRef = useRef<HTMLDivElement>(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const handleRefreshClick = useMemo(
    () =>
      debounce(
        () => {
          void onRefreshRef.current();
          iconRef.current?.classList.add("spin-animation");
          setTimeout(() => {
            iconRef.current?.classList.remove("spin-animation");
          }, 500);
        },
        2000,
        { leading: true, trailing: false },
      ),
    [],
  );

  useEffect(() => () => handleRefreshClick.cancel(), [handleRefreshClick]);

  return (
    <div className="min-w-96 max-h-full h-96 flex flex-col border rounded-md py-3 overflow-hidden">
      <div className="font-semibold px-4 ">{NOTICE_LABEL.listTitle}</div>

      <div
        className="flex flex-row justify-end w-full px-4 cursor-pointer"
        onClick={handleRefreshClick}
      >
        <div ref={iconRef} className="transition-transform duration-1000">
          <RefreshCcw size={16} />
        </div>
      </div>
      {notices.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-gray-400">
          {NOTICE_MESSAGE.emptyList}
        </div>
      ) : (
        <div className="flex flex-col flex-grow overflow-y-auto gap-2 pt-4 px-2">
          {notices.map((info) => {
            const isSelected = selectedNoticeId === info.noticeId;
            const { datePart, timePart } = splitNoticeUpdatedAt(info.updatedAt);
            return (
              <div
                key={info.noticeId}
                className={
                  isSelected
                    ? "px-4 py-2 border rounded-md flex flex-row items-center cursor-pointer bg-blue-100 border-blue-500 ring-1 ring-blue-500"
                    : "px-4 py-2 border rounded-md flex flex-row items-center cursor-pointer bg-white border-gray-200"
                }
                onClick={() => onSelectNotice(info.noticeId)}
              >
                <div
                  className={
                    isSelected
                      ? "flex-grow text-lg font-semibold text-blue-500"
                      : "flex-grow text-lg font-semibold text-gray-900"
                  }
                >
                  {info.title}
                </div>
                <div className="flex flex-col justify-end items-end h-12">
                  <span className="text-sm text-gray-400">{datePart}</span>
                  <span className="text-xs text-gray-400">{timePart}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
