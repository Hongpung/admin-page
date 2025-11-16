"use client";

import type { ReactNode } from "react";

type TableSectionProps = {
  /** 테이블 카드 상단 왼쪽 (검색 요약, 페이지 문구 등) */
  toolbarLeft?: ReactNode;
  /** 테이블 카드 상단 오른쪽 (VisibleLength 등) */
  toolbarRight?: ReactNode;
  children: ReactNode;
  /** 테이블 하단 (페이지네이션 등) */
  footer?: ReactNode;
  className?: string;
};

/**
 * 테이블 카드: 상단 툴바(좌/우) + 본문 + 하단 푸터.
 * VisibleLength는 보통 toolbarRight, Pagination은 footer에 둡니다.
 */
export default function TableSection({
  toolbarLeft,
  toolbarRight,
  children,
  footer,
  className = "",
}: TableSectionProps) {
  const showToolbar = toolbarLeft != null || toolbarRight != null;

  return (
    <div
      className={`flex flex-col mx-2 mt-4 border rounded-md border-blue-100 mb-2 min-h-[672px] ${className}`}
    >
      {showToolbar && (
        <div className="flex flex-row justify-between items-center gap-3 px-3 py-2 border-b border-blue-100 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {toolbarLeft}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {toolbarRight}
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
      {footer != null && footer !== false && (
        <div className="shrink-0 border-t border-blue-100 px-2 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}
