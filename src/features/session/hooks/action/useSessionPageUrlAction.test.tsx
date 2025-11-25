import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSessionPageUrlAction } from "./useSessionPageUrlAction";

describe("세션 페이지 URL 액션 훅", () => {
  it("pushSessionId는 기존 쿼리를 유지한 채 sessionId를 설정한다", () => {
    const push = vi.fn();
    const replace = vi.fn();

    const { result } = renderHook(() =>
      useSessionPageUrlAction({
        pathname: "/session",
        router: { push, replace },
        searchParams: new URLSearchParams("x=1"),
      }),
    );

    result.current.pushSessionId(10);

    expect(push).toHaveBeenCalledWith("/session?x=1&sessionId=10", {
      scroll: false,
    });
  });

  it("deleteSessionIdWithReplace는 sessionId만 제거한다", () => {
    const push = vi.fn();
    const replace = vi.fn();

    const { result } = renderHook(() =>
      useSessionPageUrlAction({
        pathname: "/session",
        router: { push, replace },
        searchParams: new URLSearchParams("sessionId=10&x=1"),
      }),
    );

    result.current.deleteSessionIdWithReplace();

    expect(replace).toHaveBeenCalledWith("/session?x=1", { scroll: false });
  });
});
