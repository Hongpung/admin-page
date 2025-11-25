import { describe, expect, it } from "vitest";
import {
  clubProfileFormFirstMessage,
  parseClubProfileForm,
} from "./club-profile-form";

describe("동아리 프로필 폼 파싱", () => {
  it("유효한 요청 데이터를 파싱한다", () => {
    const result = parseClubProfileForm({
      profileImageUrl: "https://example.com/profile.png",
      profileImageFile: null,
      roleAssignments: { "패짱": 1, "상쇠": null },
    });

    expect(result.success).toBe(true);
  });

  it("빈 프로필 주소를 없음으로 정리한다", () => {
    const result = parseClubProfileForm({
      profileImageUrl: "   ",
      profileImageFile: null,
      roleAssignments: {},
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profileImageUrl).toBeNull();
    }
  });

  it("이미지가 아닌 파일을 거부한다", () => {
    const file = new File(["x"], "a.txt", { type: "text/plain" });

    const result = parseClubProfileForm({
      profileImageUrl: null,
      profileImageFile: file,
      roleAssignments: {},
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(clubProfileFormFirstMessage(result.error)).toBe(
        "이미지 파일만 업로드할 수 있습니다.",
      );
    }
  });
});
