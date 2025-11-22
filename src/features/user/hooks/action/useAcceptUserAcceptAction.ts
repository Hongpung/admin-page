import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SignUpRequestUser } from "../../types";
import {
  acceptSignupRequests,
  removeAcceptedSignups,
  toUserActionErrorMessage,
} from "../../service";

type Args = {
  queryKey: readonly unknown[];
};

function buildAcceptSuccessMessage(count: number): string {
  return `가입 요청 ${count}건을 승인했습니다.`;
}

export function useAcceptUserAcceptAction({ queryKey }: Args) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const acceptMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await acceptSignupRequests(ids);
      return ids;
    },
    onSuccess: (acceptedIds) => {
      setErrorMessage(null);
      queryClient.setQueryData<SignUpRequestUser[]>(queryKey, (prev) =>
        removeAcceptedSignups(prev, acceptedIds),
      );
      alert(buildAcceptSuccessMessage(acceptedIds.length));
    },
    onError: (error) => {
      const message = toUserActionErrorMessage(error);
      setErrorMessage(message);
      alert(message);
    },
  });

  return {
    acceptSignupIds: acceptMutation.mutateAsync,
    isAccepting: acceptMutation.isPending,
    errorMessage,
  };
}
