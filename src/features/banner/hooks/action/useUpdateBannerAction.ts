import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, type FormEvent } from "react";
import type { BannerDTO } from "../../types";
import { bannerFormFirstMessage, parseBannerUpdateForm } from "../../lib/banner-form";
import { runBannerUpdateFlow } from "../../lib/banner-submit-flow";
import { bannerQueryKeys } from "../../queries";

type SubmitUpdateBannerArgs = {
  event: FormEvent<HTMLFormElement>;
  updatedPart: Record<string, boolean>;
  originBanner: BannerDTO;
};

export function useUpdateBannerAction({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();
  const updateBannerMutation = useMutation({
    mutationFn: ({
      updatedPart,
      originBanner,
      formData,
    }: {
      updatedPart: Record<string, boolean>;
      originBanner: BannerDTO;
      formData: FormData;
    }) => {
      const parsed = parseBannerUpdateForm(formData, updatedPart);
      if (!parsed.success) {
        throw new Error(bannerFormFirstMessage(parsed.error));
      }
      return runBannerUpdateFlow(parsed.data, updatedPart, originBanner);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bannerQueryKeys.buckets() });
      onSuccess?.();
    },
  });

  const submitUpdateBanner = useCallback(
    async ({ event, updatedPart, originBanner }: SubmitUpdateBannerArgs) => {
      event.preventDefault();
      try {
        const result = await updateBannerMutation.mutateAsync({
          formData: new FormData(event.currentTarget),
          updatedPart,
          originBanner,
        });
        if (!result.ok) {
          alert(result.message);
          return;
        }
        alert(result.message);
      } catch (e) {
        alert(e instanceof Error ? e.message : "諛곕꼫 ?섏젙???ㅽ뙣?덉뒿?덈떎.");
      }
    },
    [updateBannerMutation],
  );

  return {
    submitUpdateBanner,
    isPending: updateBannerMutation.isPending,
  };
}
