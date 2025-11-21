"use client";

import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { COLUMN_META } from "../../constants/primary.constants";
import { InsertionSlot } from "./InsertionSlot";
import { MemberCard } from "./MemberCard";
import type { BoardMember, ColumnId } from "../../types/primary-members";

export function MemberColumn({
  columnId,
  memberIds,
  memberMap,
  previewIndex,
  disableSlotHighlight,
  sourcePlaceholderIndex,
  selectedMemberIds,
  onToggleMemberSelect,
  onToggleSelectAll,
}: {
  columnId: ColumnId;
  memberIds: number[];
  memberMap: Record<number, BoardMember>;
  previewIndex: number | null;
  disableSlotHighlight: boolean;
  sourcePlaceholderIndex: number | null;
  selectedMemberIds: ReadonlySet<number>;
  onToggleMemberSelect: (memberId: number, columnId: ColumnId) => void;
  onToggleSelectAll: () => void;
}) {
  const { setNodeRef } = useDroppable({ id: columnId });
  const meta = COLUMN_META[columnId];
  const allMembersSelected =
    memberIds.length > 0 && memberIds.every((id) => selectedMemberIds.has(id));
  const normalizedPreviewIndex =
    previewIndex === null
      ? null
      : Math.max(0, Math.min(previewIndex, memberIds.length));
  const isColumnActive = normalizedPreviewIndex !== null;
  const hasContent = memberIds.length > 0 || normalizedPreviewIndex !== null;

  return (
    <section
      className={`flex h-full min-h-[28rem] flex-col rounded-xl border p-4 ${
        isColumnActive ? "border-blue-400 bg-blue-50/40" : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="min-w-0 text-sm font-semibold text-gray-800">
          {meta.title}
        </h2>
        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <button
            type="button"
            onClick={onToggleSelectAll}
            disabled={memberIds.length === 0}
            className="whitespace-nowrap rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {allMembersSelected ? "전체 해제" : "전체 선택"}
          </button>
          <span className="rounded bg-white px-2 py-1 text-xs text-gray-600">
            {memberIds.length}명
          </span>
        </div>
      </div>

      <div ref={setNodeRef} className="min-h-[22rem] flex-1">
        {hasContent ? (
          <ul className="space-y-0">
            <InsertionSlot
              columnId={columnId}
              index={0}
              isPreview={normalizedPreviewIndex === 0}
              disableHighlight={disableSlotHighlight}
            />
            {sourcePlaceholderIndex === 0 ? (
              <li aria-hidden="true" className="py-1">
                <div className="min-h-[148px]" />
              </li>
            ) : null}
            {memberIds.flatMap((memberId, index) => {
              const member = memberMap[memberId];
              const nodes: ReactNode[] = [];

              if (sourcePlaceholderIndex === index && index !== 0) {
                nodes.push(
                  <li
                    key={`source-placeholder-${columnId}-${index}`}
                    className="py-1"
                    aria-hidden="true"
                  >
                    <div className="min-h-[148px]" />
                  </li>,
                );
              }

              if (member) {
                nodes.push(
                  <MemberCard
                    key={`member-${member.memberId}`}
                    member={member}
                    columnId={columnId}
                    isSelected={selectedMemberIds.has(member.memberId)}
                    onToggleSelect={onToggleMemberSelect}
                  />,
                );
              }

              nodes.push(
                <InsertionSlot
                  key={`slot-${columnId}-${index + 1}`}
                  columnId={columnId}
                  index={index + 1}
                  isPreview={normalizedPreviewIndex === index + 1}
                  disableHighlight={disableSlotHighlight}
                />,
              );

              return nodes;
            })}
            {sourcePlaceholderIndex === memberIds.length &&
            sourcePlaceholderIndex !== 0 ? (
              <li aria-hidden="true" className="py-1">
                <div className="min-h-[148px]" />
              </li>
            ) : null}
          </ul>
        ) : (
          <ul className="relative flex min-h-[22rem] flex-1 flex-col">
            <InsertionSlot
              columnId={columnId}
              index={0}
              isPreview={normalizedPreviewIndex === 0}
              disableHighlight={disableSlotHighlight}
              fillEmptyColumn
            />
            <li
              className={`pointer-events-none absolute inset-0 flex items-start justify-center pt-40 text-center text-sm text-gray-500 transition-opacity ${
                isColumnActive ? "opacity-0" : "opacity-100"
              }`}
            >
              {meta.emptyMessage}
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}
