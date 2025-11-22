import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { deleteNotice } from "../../api/notice-api";
import {
  buildDeleteFailMessage,
  NOTICE_MESSAGE,
} from "../../constants";
import { noticeQueryKeys } from "../../queries/notice-query-options";

export function useDeleteNotice({
  parsedNoticeId,
  clearNoticeId,
}: {
  parsedNoticeId: number | null;
  clearNoticeId: () => void;
}) {
  const queryClient = useQueryClient();
  const deleteNoticeMutation = useMutation({
    mutationFn: (infoId: number) => deleteNotice({ infoId }),
  });

  const deleteNoticeById = useCallback(
    async (infoId: number) => {
      try {
        await deleteNoticeMutation.mutateAsync(infoId);
        await queryClient.invalidateQueries({ queryKey: noticeQueryKeys.list() });
        if (parsedNoticeId != null) {
          await queryClient.invalidateQueries({
            queryKey: noticeQueryKeys.detail(parsedNoticeId),
          });
        }
        clearNoticeId();
        alert(NOTICE_MESSAGE.deleteSuccessAlert);
      } catch (e: unknown) {
        if (e instanceof Error) {
          alert(buildDeleteFailMessage(e.message));
        } else {
          alert(NOTICE_MESSAGE.deleteFailAlert);
        }
      }
    },
    [clearNoticeId, deleteNoticeMutation, parsedNoticeId, queryClient],
  );

  return {
    deleteNoticeById,
  };
}
