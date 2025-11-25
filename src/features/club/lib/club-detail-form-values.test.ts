import { describe, expect, it } from "vitest";
import { buildClubDetailFormValues } from "./club-detail-form-values";
import type { ClubInfo } from "../types";

const club: ClubInfo = {
  clubId: 9,
  clubName: "탈반",
  profileImage: "https://example.com/image.png",
  roleData: [],
};

describe("동아리 상세 폼 값 생성", () => {
  it("초기 폼 값을 구성한다", () => {
    const result = buildClubDetailFormValues(club);

    expect(result.clubId).toBe(9);
    expect(result.clubName).toBe("탈반");
    expect(result.file).toBeNull();
    expect(result.profileImageUrl).toBe("https://example.com/image.png");
    expect(result.roleAssignments).toBeDefined();
    expect(result.roleAssigneeNames).toBeDefined();
  });
});
