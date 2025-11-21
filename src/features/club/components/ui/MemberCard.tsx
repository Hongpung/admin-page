"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { formatUpdatedAt } from "../../lib/board-utils";
import { createMemberDropId } from "../../lib/drop-ids.lib";
import type { BoardMember, ColumnId } from "../../types/primary-members";

export function MemberCardContent({ member }: { member: BoardMember }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{member.name}</p>
          <p className="text-xs text-gray-500">{member.nickname || "-"}</p>
          <p className="mt-1 text-xs text-gray-500">{member.email || "-"}</p>
        </div>
        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
          #{member.memberId}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-xs text-gray-600">
        <p>학번: {member.enrollmentNumber || "-"}</p>
        <p>
          역할:{" "}
          {member.roleAssignment?.length
            ? member.roleAssignment.join(", ")
            : "-"}
        </p>
        <p>마지막 수정: {formatUpdatedAt(member.updatedAt)}</p>
      </div>
    </>
  );
}

export function MemberCard({
  member,
  columnId,
  isSelected,
  onToggleSelect,
}: {
  member: BoardMember;
  columnId: ColumnId;
  isSelected: boolean;
  onToggleSelect: (memberId: number, columnId: ColumnId) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: member.memberId,
  });
  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: createMemberDropId(member.memberId),
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <li ref={setNodeRef} style={style} className="py-1">
      <div
        className={`flex overflow-hidden rounded-lg border bg-white shadow-sm transition ${
          isDragging ? "border-blue-300 opacity-70" : "border-gray-200"
        } ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
      >
        <div
          className="flex shrink-0 cursor-grab touch-none select-none items-center justify-center border-r border-gray-200 bg-gray-50 px-1.5 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="드래그하여 이동"
        >
          <GripVertical
            className="h-[18px] w-[18px] shrink-0 text-gray-400"
            strokeWidth={2}
            aria-hidden
          />
        </div>
        <button
          type="button"
          className="min-w-0 flex-1 p-3 text-left outline-none transition hover:bg-gray-50/80 focus-visible:bg-gray-50/80"
          onClick={() => onToggleSelect(member.memberId, columnId)}
        >
          <MemberCardContent member={member} />
        </button>
      </div>
    </li>
  );
}
