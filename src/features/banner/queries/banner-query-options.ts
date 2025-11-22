import { queryOptions } from "@tanstack/react-query";
import type { BannerDTO } from "../types";
import { loadBanners } from "../api/banner-api";

export const bannerQueryKeys = {
  all: ["banner"] as const,
  buckets: () => [...bannerQueryKeys.all, "buckets"] as const,
};

export type BannerBuckets = {
  BeforePost: BannerDTO[];
  OnPost: BannerDTO[];
  AfterPost: BannerDTO[];
};

export function bannerBucketsQueryOptions() {
  return queryOptions<BannerBuckets>({
    queryKey: bannerQueryKeys.buckets(),
    queryFn: async () => loadBanners(),
  });
}
