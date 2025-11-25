import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveClubDetail } from "./club-detail-save";
import * as clubApi from "../api/club-api";
import type { ClubInfo } from "../types";

const baseClub: ClubInfo = {
  clubId: 7,
  clubName: "테스트 동아리",
  profileImage: "https://example.com/old.png",
  roleData: [],
};

describe("동아리 상세 저장", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
  });

  it("잘못된 이미지 주소이면 검증 메시지를 던진다", async () => {
    await expect(
      saveClubDetail({
        club: baseClub,
        initialProfileImageUrl: baseClub.profileImage,
        file: null,
        profileImageUrl: "not-url",
        roleAssignments: {},
      }),
    ).rejects.toThrow("프로필 이미지 URL이 올바르지 않습니다.");
  });

  it("이미지를 업로드하고 업로드된 주소로 요청 데이터를 갱신한다", async () => {
    vi.spyOn(clubApi, "uploadImage").mockResolvedValue("https://example.com/new.png");
    const patchSpy = vi
      .spyOn(clubApi, "updateClubProfile")
      .mockResolvedValue({ message: "ok" });

    const file = new File(["image"], "avatar.png", { type: "image/png" });

    const result = await saveClubDetail({
      club: baseClub,
      initialProfileImageUrl: baseClub.profileImage,
      file,
      profileImageUrl: baseClub.profileImage,
      roleAssignments: { "패짱": 1 },
    });

    expect(clubApi.uploadImage).toHaveBeenCalledTimes(1);
    expect(patchSpy).toHaveBeenCalledWith(baseClub.clubId, {
      profileImageUrl: "https://example.com/new.png",
      roleAssignments: { "패짱": 1 },
    });
    expect(result.profileImageUrl).toBe("https://example.com/new.png");
  });

  it("업로드가 실패하면 예외를 던진다", async () => {
    vi.spyOn(clubApi, "uploadImage").mockResolvedValue(null);
    vi.spyOn(clubApi, "updateClubProfile").mockResolvedValue({ message: "ok" });

    const file = new File(["image"], "avatar.png", { type: "image/png" });

    await expect(
      saveClubDetail({
        club: baseClub,
        initialProfileImageUrl: baseClub.profileImage,
        file,
        profileImageUrl: baseClub.profileImage,
        roleAssignments: {},
      }),
    ).rejects.toThrow("프로필 이미지 업로드에 실패했습니다.");
  });

  it("파일 없이 변경된 프로필 이미지 주소를 전송한다", async () => {
    const patchSpy = vi
      .spyOn(clubApi, "updateClubProfile")
      .mockResolvedValue({ message: "ok" });

    await saveClubDetail({
      club: baseClub,
      initialProfileImageUrl: baseClub.profileImage,
      file: null,
      profileImageUrl: "https://example.com/changed.png",
      roleAssignments: {},
    });

    expect(patchSpy).toHaveBeenCalledWith(baseClub.clubId, {
      profileImageUrl: "https://example.com/changed.png",
      roleAssignments: {},
    });
  });
});
