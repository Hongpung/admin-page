import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NOTICE_QUERY_PARAM } from "../../constants/notice-query.constants";
import { parseNoticeIdParam } from "../../lib/notice-url";

export function useNoticeManageUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const noticeIdParam = searchParams.get(NOTICE_QUERY_PARAM.noticeId);
  const parsedNoticeId = useMemo(
    () => parseNoticeIdParam(noticeIdParam),
    [noticeIdParam],
  );

  const replaceSearchParams = useCallback(
    (next: URLSearchParams) => {
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const clearNoticeId = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(NOTICE_QUERY_PARAM.noticeId);
    replaceSearchParams(params);
  }, [replaceSearchParams, searchParams]);

  const selectNoticeId = useCallback(
    (noticeId: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(NOTICE_QUERY_PARAM.noticeId, String(noticeId));
      const q = params.toString();
      router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return {
    searchParams,
    noticeIdParam,
    parsedNoticeId,
    replaceSearchParams,
    clearNoticeId,
    selectNoticeId,
  };
}
