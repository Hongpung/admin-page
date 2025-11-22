import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  manageUserQueryKeys,
  manageUserUpdateMutationOptions,
} from "../../queries";
import type { UpdateMemberByAdminReqDto } from "../../types";
import { toManageUserActionErrorMessage } from "../../service";

type UpdateArgs = {
  memberId: number;
  payload: UpdateMemberByAdminReqDto;
};

export function useManageUserUpdateAction() {
  const queryClient = useQueryClient();
  const updateUserMutation = useMutation(manageUserUpdateMutationOptions());

  const tryUpdateManagedUser = async ({
    memberId,
    payload,
  }: UpdateArgs): Promise<boolean> => {
    try {
      await updateUserMutation.mutateAsync({ memberId, payload });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: manageUserQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: manageUserQueryKeys.detail(memberId),
        }),
      ]);
      alert("회원 정보가 수정되었습니다.");
      return true;
    } catch (error) {
      alert(
        toManageUserActionErrorMessage(
          error,
          "회원 정보 수정에 실패했습니다.",
        ),
      );
      return false;
    }
  };

  return {
    tryUpdateManagedUser,
    isUpdating: updateUserMutation.isPending,
  };
}
