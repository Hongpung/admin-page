import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "../../types";
import { deleteManagedUser } from "../../service";
import { manageUserQueryKeys } from "../../queries";

export function useManageUserDeleteAction() {
  const queryClient = useQueryClient();
  const deleteUserMutation = useMutation({
    mutationFn: ({ user, password }: { user: User; password: string }) =>
      deleteManagedUser(user, password),
  });

  const tryDeleteManagedUser = async (user: User, password: string) => {
    try {
      const ok = await deleteUserMutation.mutateAsync({ user, password });
      if (!ok) throw Error("Failed to Delete User");
      await queryClient.invalidateQueries({ queryKey: manageUserQueryKeys.all });

      alert(`${user.name}님을 회원에서 삭제했습니다.`);
    } catch (e) {
      alert("회원 삭제에 실패했습니다.");
    }
  };

  return {
    tryDeleteManagedUser,
    isDeleting: deleteUserMutation.isPending,
  };
}
