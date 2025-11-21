"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateSubClubPrimaryMembers } from "../../api/club-api";
import { usePrimaryMembersBoardDnd } from "../../hooks/state/usePrimaryMembersBoardDnd";
import { usePrimaryMembersBoardSelection } from "../../hooks/state/usePrimaryMembersBoardSelection";
import {
  clubQueryKeys,
  subClubMembersQueryOptions,
  subClubPrimaryMembersQueryOptions,
} from "../../queries/club-query-options";
import { PrimaryMembersBoardView } from "./PrimaryMembersBoardView";

export function ClubPrimaryMembersBoardSub() {
  const queryClient = useQueryClient();
  const membersQuery = useQuery(subClubMembersQueryOptions());
  const primaryMembersQuery = useQuery(subClubPrimaryMembersQueryOptions());
  const savePrimaryMembersMutation = useMutation({
    mutationFn: updateSubClubPrimaryMembers,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: clubQueryKeys.subPrimaryMembers(),
      });
    },
  });

  const boardDnd = usePrimaryMembersBoardDnd({
    members: membersQuery.data,
    primaryMembers: primaryMembersQuery.data,
    sourceError: membersQuery.error ?? primaryMembersQuery.error,
  });
  const selection = usePrimaryMembersBoardSelection({
    board: boardDnd.board,
    setBoard: boardDnd.setBoard,
  });

  const isLoading =
    membersQuery.isLoading ||
    primaryMembersQuery.isLoading ||
    membersQuery.isFetching ||
    primaryMembersQuery.isFetching;

  const handleSave = async () => {
    if (boardDnd.board.active.length === 0) {
      alert("활성 멤버는 최소 1명 이상이어야 합니다.");
      return;
    }

    try {
      const result = await savePrimaryMembersMutation.mutateAsync(
        boardDnd.board.active,
      );
      boardDnd.markSaved();
      alert(result.message || "주요 멤버 저장이 완료되었습니다.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장에 실패했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[24rem] items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500">
        주요 멤버 정보를 불러오는 중입니다.
      </div>
    );
  }

  if (boardDnd.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {boardDnd.error}
      </div>
    );
  }

  return (
    <PrimaryMembersBoardView
      board={boardDnd.board}
      memberMap={boardDnd.memberMap}
      hasChanges={boardDnd.hasChanges}
      isSaving={savePrimaryMembersMutation.isPending}
      draggingState={boardDnd.draggingState}
      dropPreview={boardDnd.dropPreview}
      selectedInactiveIds={selection.selectedInactiveIds}
      selectedActiveIds={selection.selectedActiveIds}
      canSwapSelections={selection.canSwapSelections}
      canMoveToActive={selection.canMoveToActive}
      canMoveToInactive={selection.canMoveToInactive}
      onSave={handleSave}
      onDragStart={boardDnd.handleDragStart}
      onDragOver={boardDnd.updateDropPreview}
      onDragCancel={boardDnd.handleDragCancel}
      onDragEnd={boardDnd.handleDragEnd}
      onToggleMemberSelect={selection.toggleMemberSelect}
      onToggleSelectAllInColumn={selection.toggleSelectAllInColumn}
      onSwapSelectionsBetweenColumns={selection.swapSelectionsBetweenColumns}
      onMoveSelectedToActive={selection.moveSelectedToActive}
      onMoveSelectedToInactive={selection.moveSelectedToInactive}
    />
  );
}
