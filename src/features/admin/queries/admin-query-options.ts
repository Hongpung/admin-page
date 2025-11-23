import { queryOptions } from "@tanstack/react-query";
import { fetchAdminList, fetchAdminSession } from "../api/admin-api";
import type { AdminSimple } from "../types";

export const adminQueryKeys = {
  all: ["admin"] as const,
  list: () => [...adminQueryKeys.all, "list"] as const,
  session: () => [...adminQueryKeys.all, "session"] as const,
};

export function adminListQueryOptions() {
  return queryOptions<AdminSimple[]>({
    queryKey: adminQueryKeys.list(),
    queryFn: async () => {
      const { admins } = await fetchAdminList();
      return admins;
    },
  });
}

export function adminSessionQueryOptions() {
  return queryOptions({
    queryKey: adminQueryKeys.session(),
    queryFn: fetchAdminSession,
  });
}
