import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseFormGetValues, UseFormReset } from "react-hook-form";
import { buildClubDetailFormValues } from "../../lib/club-detail-form-values";
import { saveClubDetail } from "../../lib/club-detail-save";
import type { ClubDetailFormValues, ClubInfo } from "../../types";

type SaveVariables = {
  formValues: ClubDetailFormValues;
  club: ClubInfo;
};

export function useClubDetailSave({
  club,
  getValues,
  reset,
  submitForm,
  invalidateKeys = [],
  saveDetail = saveClubDetail,
}: {
  club: ClubInfo;
  getValues: UseFormGetValues<ClubDetailFormValues>;
  reset: UseFormReset<ClubDetailFormValues>;
  submitForm: (
    onValid: (formValues: ClubDetailFormValues) => Promise<void>,
  ) => () => void;
  invalidateKeys?: ReadonlyArray<readonly unknown[]>;
  saveDetail?: typeof saveClubDetail;
}) {
  const queryClient = useQueryClient();
  const saveMutation = useMutation({
    mutationFn: async ({ formValues, club }: SaveVariables) =>
      saveDetail({
        club,
        initialProfileImageUrl: club.profileImage ?? null,
        file: formValues.file,
        profileImageUrl: formValues.profileImageUrl,
        roleAssignments: formValues.roleAssignments,
      }),
  });

  const handleSave = submitForm(async (formValues) => {
    const ok = window.confirm("변경 사항을 적용하시겠습니까?");
    if (!ok) return;

    try {
      const saved = await saveMutation.mutateAsync({
        formValues,
        club,
      });

      reset({
        ...buildClubDetailFormValues({
          ...club,
          profileImage: saved.profileImageUrl,
        }),
        roleAssignments: saved.roleAssignments,
        roleAssigneeNames: getValues("roleAssigneeNames"),
      });

      await Promise.all(
        invalidateKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );

      alert("동아리 정보가 업데이트되었습니다.");
    } catch (error) {
      alert(
        `업데이트 실패: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
      );
    }
  });

  return {
    isSaving: saveMutation.isPending,
    handleSave,
  };
}
