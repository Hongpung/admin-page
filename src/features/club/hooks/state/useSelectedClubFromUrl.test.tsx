import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClubInfo } from "../../types";

const pushMock = vi.fn();
const replaceMock = vi.fn();

let mockPathname = "/dashboard/club";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

import { useSelectedClubFromUrl } from "./useSelectedClubFromUrl";

const clubs: ClubInfo[] = [
  { clubId: 1, clubName: "A", profileImage: null, roleData: [] },
  { clubId: 2, clubName: "B", profileImage: null, roleData: [] },
];

describe("URL 기반 동아리 선택 훅", () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    mockPathname = "/dashboard/club";
    mockSearchParams = new URLSearchParams();
  });

  it("잘못된 동아리 식별자 쿼리를 제거한다", () => {
    mockSearchParams = new URLSearchParams("clubId=abc&x=1");

    renderHook(() => useSelectedClubFromUrl(clubs));

    expect(replaceMock).toHaveBeenCalledWith("/dashboard/club?x=1", {
      scroll: false,
    });
  });

  it("동아리 선택 시 다음 동아리 식별자로 이동한다", () => {
    const { result } = renderHook(() => useSelectedClubFromUrl(clubs));

    act(() => {
      result.current.selectClub(clubs[1]!);
    });

    expect(pushMock).toHaveBeenCalledWith("/dashboard/club?clubId=2", {
      scroll: false,
    });
  });

  it("변경된 상태에서 확인을 취소하면 이동을 막는다", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const { result } = renderHook(() => useSelectedClubFromUrl(clubs));

    act(() => {
      result.current.setIsDetailDirty(true);
    });

    act(() => {
      result.current.selectClub(clubs[0]!);
    });

    expect(pushMock).not.toHaveBeenCalled();
  });
});
