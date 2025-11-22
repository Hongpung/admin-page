import { queryOptions } from "@tanstack/react-query";
import {
  fetchSignupData,
  fetchSignupDataSub,
} from "../api/accept-api";
import type { SignupListResDto } from "../types";
import { normalizeSignupList } from "../lib/signup-list";

export const acceptUserQueryKeys = {
  all: ["user", "accept"] as const,
  superList: () => [...acceptUserQueryKeys.all, "super"] as const,
  subList: () => [...acceptUserQueryKeys.all, "sub"] as const,
};

export function acceptUserListQueryOptions(isSub: boolean) {
  return queryOptions<SignupListResDto[]>({
    queryKey: isSub
      ? acceptUserQueryKeys.subList()
      : acceptUserQueryKeys.superList(),
    queryFn: async () => {
      const data = isSub ? await fetchSignupDataSub() : await fetchSignupData();
      return normalizeSignupList(data);
    },
  });
}
