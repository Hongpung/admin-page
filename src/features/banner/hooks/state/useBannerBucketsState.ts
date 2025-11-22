import { useQuery } from "@tanstack/react-query";
import { bannerBucketsQueryOptions } from "../../queries";

export function useBannerBucketsState() {
  const bannersQuery = useQuery(bannerBucketsQueryOptions());

  const activeBanners = bannersQuery.data?.OnPost ?? [];
  const oldBanners = bannersQuery.data?.BeforePost ?? [];
  const plannedBanners = bannersQuery.data?.AfterPost ?? [];

  return {
    activeBanners,
    oldBanners,
    plannedBanners,
    isLoading: bannersQuery.isLoading,
  };
}
