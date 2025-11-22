import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { deleteBanner } from "../../api/banner-api";
import { bannerQueryKeys } from "../../queries";

export function useDeleteBannerAction() {
  const queryClient = useQueryClient();
  const deleteBannerMutation = useMutation({
    mutationFn: deleteBanner,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bannerQueryKeys.buckets() });
      alert("??젣?섏뿀?듬땲??");
    },
  });

  const deleteBannerById = useCallback(
    (bannerId: string) => {
      void (async () => {
        try {
          await deleteBannerMutation.mutateAsync(bannerId);
        } catch (e) {
          alert(
            "??젣???ㅽ뙣?덉뒿?덈떎. ?ㅼ떆 ?뺤씤?댁＜?몄슂." +
              (e instanceof Error ? ` (${e.message})` : ""),
          );
        }
      })();
    },
    [deleteBannerMutation],
  );

  return {
    deleteBannerById,
    isPending: deleteBannerMutation.isPending,
  };
}
