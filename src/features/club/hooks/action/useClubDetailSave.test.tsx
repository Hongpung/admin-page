import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useClubDetailSave } from "./useClubDetailSave";
import type { ClubDetailFormValues, ClubInfo } from "../../types";

const baseClub: ClubInfo = {
  clubId: 1,
  clubName: "A",
  profileImage: null,
  roleData: [],
};

const baseFormValues: ClubDetailFormValues = {
  clubId: 1,
  clubName: "A",
  file: null,
  profileImageUrl: null,
  roleAssignments: {},
  roleAssigneeNames: {},
};

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

describe("동아리 상세 저장 훅", () => {
  it("확인이 취소되면 아무 작업도 하지 않는다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const saveDetail = vi.fn();
    const reset = vi.fn();

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useClubDetailSave({
          club: baseClub,
          getValues: vi.fn().mockReturnValue({}),
          reset,
          submitForm: (onValid) => () => {
            void onValid(baseFormValues);
          },
          invalidateKeys: [["club", "profiles"]],
          saveDetail,
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.handleSave();
      await Promise.resolve();
    });

    expect(saveDetail).not.toHaveBeenCalled();
    expect(reset).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("저장 성공 시 초기화와 캐시 무효화를 실행하고 알림을 표시한다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const saveDetail = vi.fn().mockResolvedValue({
      profileImageUrl: "https://example.com/new.png",
      roleAssignments: { "패짱": 1 },
    });

    const reset = vi.fn();
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () =>
        useClubDetailSave({
          club: baseClub,
          getValues: vi.fn().mockReturnValue({ "패짱": "홍길동" }),
          reset,
          submitForm: (onValid) => () => {
            void onValid(baseFormValues);
          },
          invalidateKeys: [["club", "profiles"]],
          saveDetail,
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.handleSave();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(saveDetail).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["club", "profiles"] });
    expect(alertSpy).toHaveBeenCalledWith("동아리 정보가 업데이트되었습니다.");
  });

  it("저장 중 예외가 발생하면 실패 메시지를 알린다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const saveDetail = vi.fn().mockRejectedValue(new Error("boom"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useClubDetailSave({
          club: baseClub,
          getValues: vi.fn().mockReturnValue({}),
          reset: vi.fn(),
          submitForm: (onValid) => () => {
            void onValid(baseFormValues);
          },
          saveDetail,
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.handleSave();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(alertSpy).toHaveBeenCalledWith("업데이트 실패: boom");
  });
});
