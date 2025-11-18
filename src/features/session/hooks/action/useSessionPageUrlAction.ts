import { useCallback } from "react";

type RouterLike = {
  push: (href: string, options?: { scroll?: boolean }) => void;
  replace: (href: string, options?: { scroll?: boolean }) => void;
};

type ReadonlyURLSearchParams = {
  toString(): string;
};

export function useSessionPageUrlAction({
  pathname,
  router,
  searchParams,
}: {
  pathname: string;
  router: RouterLike;
  searchParams: URLSearchParams | ReadonlyURLSearchParams;
}) {
  const deleteSessionIdWithReplace = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sessionId");
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  const pushSessionId = useCallback(
    (sessionId: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sessionId", String(sessionId));
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  return {
    deleteSessionIdWithReplace,
    pushSessionId,
  };
}
