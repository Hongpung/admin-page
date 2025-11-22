import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, type FormEvent } from "react";
import {
  buildCreateFailMessage,
  NOTICE_MESSAGE
} from "../../constants";
import { readNoticeFormPayload } from "../../lib/notice-form-data";
import { executeRegisterNotice } from "../../lib/notice-modal-submit";
import { noticeQueryKeys } from "../../queries/notice-query-options";

export function useCreateNotice({ onClose }: { onClose: (saved: boolean) => void }) {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: executeRegisterNotice,
  });

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const payload = readNoticeFormPayload(e.currentTarget);
      try {
        const result = await createMutation.mutateAsync(payload);
        if (!result.ok) {
          alert(result.message);
          return;
        }
        await queryClient.invalidateQueries({ queryKey: noticeQueryKeys.list() });
        alert(result.message);
        onClose(true);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : NOTICE_MESSAGE.unknownError;
        alert(buildCreateFailMessage(message));
      }
    },
    [createMutation, onClose, queryClient],
  );

  return {
    handleSubmit,
  };
}
