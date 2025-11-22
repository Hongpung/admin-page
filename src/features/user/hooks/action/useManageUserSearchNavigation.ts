import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  applyManageUserSearchParams,
  parseManageUserPageSize,
} from "../../lib";

export type ManageUserSearchNavigationArgs = {
  page?: number;
  keyword?: string;
  clubId?: string;
  role?: string;
  pageSize?: number;
};

export function useManageUserSearchNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "0") || 0;
  const keyword = searchParams.get("keyword") ?? "";
  const clubId = searchParams.get("clubId") ?? undefined;
  const role = searchParams.get("role") ?? undefined;
  const pageSize = parseManageUserPageSize(
    new URLSearchParams(searchParams.toString()),
  );

  const pushSearchParams = (next: ManageUserSearchNavigationArgs) => {
    const params = new URLSearchParams(searchParams.toString());
    applyManageUserSearchParams(params, next);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const resetSearchParams = () => {
    router.push(pathname);
  };

  return {
    page,
    pageSize,
    keyword,
    clubId,
    role,
    pushSearchParams,
    resetSearchParams,
  };
}
