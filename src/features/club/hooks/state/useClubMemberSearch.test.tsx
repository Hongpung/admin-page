import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useClubMemberSearch } from "./useClubMemberSearch";
import * as clubApi from "../../api/club-api";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe("동아리 멤버 검색 훅", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("디바운스 후 키워드를 업데이트한다", async () => {
    const searchSpy = vi
      .spyOn(clubApi, "searchMembers")
      .mockResolvedValue({ members: [] });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useClubMemberSearch(1), { wrapper });

    act(() => {
      result.current.debouncedHandleChange("kim");
      vi.advanceTimersByTime(799);
    });

    expect(clubApi.searchMembers).not.toHaveBeenCalledWith(
      expect.objectContaining({ username: "kim" }),
    );

    act(() => {
      vi.advanceTimersByTime(1);
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(searchSpy).toHaveBeenCalledWith({
      username: "kim",
      clubId: "1",
    });
  });

  it("로딩 상태는 로컬 검색 상태를 포함한다", async () => {
    vi.spyOn(clubApi, "searchMembers").mockResolvedValue({ members: [] });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useClubMemberSearch(1), { wrapper });

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);
  });
});
