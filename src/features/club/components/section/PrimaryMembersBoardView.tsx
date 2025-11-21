"use client";

import { ArrowLeft, ArrowLeftRight, ArrowRight } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragCancelEvent, DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import type {
  BoardMember,
  BoardState,
  ColumnId,
  DraggingState,
  DropPreview,
} from "../../types/primary-members";
import { MemberCardContent } from "../ui/MemberCard";
import { MemberColumn } from "../ui/MemberColumn";

type PrimaryMembersBoardViewProps = {
  board: BoardState;
  memberMap: Record<number, BoardMember>;
  hasChanges: boolean;
  isSaving: boolean;
  draggingState: DraggingState | null;
  dropPreview: DropPreview | null;
  selectedInactiveIds: ReadonlySet<number>;
  selectedActiveIds: ReadonlySet<number>;
  canSwapSelections: boolean;
  canMoveToActive: boolean;
  canMoveToInactive: boolean;
  onSave: () => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragCancel: (event: DragCancelEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onToggleMemberSelect: (memberId: number, columnId: ColumnId) => void;
  onToggleSelectAllInColumn: (columnId: ColumnId) => void;
  onSwapSelectionsBetweenColumns: () => void;
  onMoveSelectedToActive: () => void;
  onMoveSelectedToInactive: () => void;
};

export function PrimaryMembersBoardView({
  board,
  memberMap,
  hasChanges,
  isSaving,
  draggingState,
  dropPreview,
  selectedInactiveIds,
  selectedActiveIds,
  canSwapSelections,
  canMoveToActive,
  canMoveToInactive,
  onSave,
  onDragStart,
  onDragOver,
  onDragCancel,
  onDragEnd,
  onToggleMemberSelect,
  onToggleSelectAllInColumn,
  onSwapSelectionsBetweenColumns,
  onMoveSelectedToActive,
  onMoveSelectedToInactive,
}: PrimaryMembersBoardViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border m-2 border-gray-200 bg-gray-100 px-4 py-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold text-gray-900">
            주요 활동 멤버 관리
          </h1>
          <p className="whitespace-pre-line text-sm text-gray-500">
            {"멤버를 클릭해 선택하고 가운데 버튼으로 이동할 수 있습니다.\n드래그로도 이동할 수 있습니다."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!hasChanges || isSaving || board.active.length === 0}
            className="rounded-md border border-blue-500 bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300"
          >
            {isSaving ? "저장 중..." : "변경 저장"}
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-1 flex-row items-stretch gap-4">
          <div className="relative min-w-0 flex-1">
            <MemberColumn
              columnId="inactive"
              memberIds={board.inactive}
              memberMap={memberMap}
              previewIndex={
                dropPreview?.columnId === "inactive" ? dropPreview.index : null
              }
              disableSlotHighlight={draggingState?.sourceColumn === "inactive"}
              sourcePlaceholderIndex={
                draggingState?.sourceColumn === "inactive"
                  ? draggingState.sourceIndex
                  : null
              }
              selectedMemberIds={selectedInactiveIds}
              onToggleMemberSelect={onToggleMemberSelect}
              onToggleSelectAll={() => onToggleSelectAllInColumn("inactive")}
            />
          </div>

          <div className="sticky top-[40dvh] z-10 flex shrink-0 flex-col items-center justify-center gap-2 self-start rounded-xl py-2">
            <button
              type="button"
              title="선택한 활성 멤버를 비활성으로 이동"
              onClick={onMoveSelectedToInactive}
              disabled={!canMoveToInactive}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-40"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              title="비활성/활성에서 고른 멤버 맞바꾸기"
              onClick={onSwapSelectionsBetweenColumns}
              disabled={!canSwapSelections}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-40"
            >
              <ArrowLeftRight className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              title="선택한 비활성 멤버를 활성으로 이동"
              onClick={onMoveSelectedToActive}
              disabled={!canMoveToActive}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-40"
            >
              <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          </div>

          <div className="relative min-w-0 flex-1">
            <MemberColumn
              columnId="active"
              memberIds={board.active}
              memberMap={memberMap}
              previewIndex={
                dropPreview?.columnId === "active" ? dropPreview.index : null
              }
              disableSlotHighlight={draggingState?.sourceColumn === "active"}
              sourcePlaceholderIndex={
                draggingState?.sourceColumn === "active"
                  ? draggingState.sourceIndex
                  : null
              }
              selectedMemberIds={selectedActiveIds}
              onToggleMemberSelect={onToggleMemberSelect}
              onToggleSelectAll={() => onToggleSelectAllInColumn("active")}
            />
          </div>
        </div>
        <DragOverlay>
          {draggingState && memberMap[draggingState.memberId] ? (
            <div
              style={{ width: draggingState.overlayWidth }}
              className="min-h-[118px] max-w-full rounded-lg border border-blue-300 bg-white p-3 opacity-95 shadow-lg"
            >
              <MemberCardContent member={memberMap[draggingState.memberId]} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
