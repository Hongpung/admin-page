import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, type FormEvent } from "react";
import { parseBannerCreateForm, bannerFormFirstMessage } from "../../lib/banner-form";
import { runBannerCreateFlow } from "../../lib/banner-submit-flow";
import { bannerQueryKeys } from "../../queries";

export function useCreateBannerAction({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();
  const createBannerMutation = useMutation({
    mutationFn: runBannerCreateFlow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bannerQueryKeys.buckets() });
      onSuccess?.();
    },
  });

  const submitCreateBanner = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        const formData = new FormData(event.currentTarget);
        const parsed = parseBannerCreateForm(formData);
        if (!parsed.success) {
          alert(bannerFormFirstMessage(parsed.error));
          return;
        }
        const result = await createBannerMutation.mutateAsync(parsed.data);
        if (!result.ok) {
          alert(result.message);
          return;
        }
        alert(result.message);
      } catch (e) {
        alert(e instanceof Error ? e.message : "諛곕꼫 ?앹꽦???ㅽ뙣?덉뒿?덈떎.");
      }
    },
    [createBannerMutation],
  );

  return {
    submitCreateBanner,
    isPending: createBannerMutation.isPending,
  };
}
