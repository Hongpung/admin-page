import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, type FormEvent } from "react";
import {
  buildUpdateFailMessage,
  NOTICE_MESSAGE,
} from "../../constants";
import { readNoticeFormPayload } from "../../lib/notice-form-data";
import { executeUpdateNotice } from "../../lib/notice-modal-submit";
import { noticeQueryKeys } from "../../queries/notice-query-options";

type UpdateNoticeVariables = {
  noticeId: number;
  title: string;
  content: string;
  noticeAll: boolean;
};

export function useModifyNotice({
  noticeId,
  onClose,
}: {
  noticeId: number;
  onClose: (saved: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: ({ noticeId, title, content, noticeAll }: UpdateNoticeVariables) =>
      executeUpdateNotice(noticeId, { title, content, noticeAll }),
  });

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const payload = readNoticeFormPayload(e.currentTarget);
      try {
        const result = await updateMutation.mutateAsync({
          noticeId,
          title: payload.title,
          content: payload.content,
          noticeAll: payload.noticeAll,
        });
        if (!result.ok) {
          alert(result.message);
          return;
        }
        await queryClient.invalidateQueries({ queryKey: noticeQueryKeys.list() });
        await queryClient.invalidateQueries({
          queryKey: noticeQueryKeys.detail(noticeId),
        });
        alert(result.message);
        onClose(true);
      } catch (e: unknown) {
          const message = e instanceof Error ? e.message : NOTICE_MESSAGE.unknownError;
        alert(buildUpdateFailMessage(message));
      }
    },
    [noticeId, onClose, queryClient, updateMutation],
  );

  return {
    handleSubmit,
  };
}
